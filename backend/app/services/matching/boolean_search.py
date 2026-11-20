"""
Safe Internal Boolean Sourcing Engine for TALENTRA.

Provides AST-based Boolean query parsing and deterministic evaluation
strictly against internal Candidate profiles and resume text in SQLite.

Supported syntax:
- AND / OR / NOT (case-insensitive)
- Parentheses: ( ... )
- Quoted phrases: "full stack", 'react native'
- Implicit AND between adjacent terms without explicit operator: e.g. 'Kubernetes Docker' -> 'Kubernetes AND Docker'
- Zero external calls, zero scraping, zero data fabrication.
"""

import re
from typing import List, Dict, Any, Optional, Set, Tuple


class Token:
    def __init__(self, type_: str, value: str):
        self.type = type_
        self.value = value

    def __repr__(self):
        return f"Token({self.type}, {repr(self.value)})"


def tokenize_boolean_query(query: str) -> List[Token]:
    """
    Tokenizes a boolean query string into a sequence of Tokens:
    LPAREN, RPAREN, AND, OR, NOT, TERM
    """
    tokens = []
    # Pattern to match quotes, parentheses, words
    pattern = r'(\(|\)|\bAND\b|\bOR\b|\bNOT\b|"[^"]*"|\'[^\']*\'|[^\s()]+)'
    raw_tokens = re.findall(pattern, query, re.IGNORECASE)

    for rt in raw_tokens:
        clean = rt.strip()
        if not clean:
            continue
        upper = clean.upper()
        if clean == '(':
            tokens.append(Token('LPAREN', '('))
        elif clean == ')':
            tokens.append(Token('RPAREN', ')'))
        elif upper == 'AND':
            tokens.append(Token('AND', 'AND'))
        elif upper == 'OR':
            tokens.append(Token('OR', 'OR'))
        elif upper == 'NOT':
            tokens.append(Token('NOT', 'NOT'))
        else:
            # Term (unquote if quoted)
            term_val = clean
            if (term_val.startswith('"') and term_val.endswith('"')) or (
                term_val.startswith("'") and term_val.endswith("'")
            ):
                term_val = term_val[1:-1].strip()
            if term_val:
                tokens.append(Token('TERM', term_val.lower()))

    # Insert implicit AND where two terms/groups are adjacent without operator
    # e.g.: TERM TERM -> TERM AND TERM
    # e.g.: RPAREN LPAREN -> RPAREN AND LPAREN
    # e.g.: RPAREN TERM -> RPAREN AND TERM
    # e.g.: TERM LPAREN -> TERM AND LPAREN
    normalized = []
    for i, tok in enumerate(tokens):
        if i > 0:
            prev = tokens[i - 1]
            if (
                prev.type in ('TERM', 'RPAREN')
                and tok.type in ('TERM', 'LPAREN', 'NOT')
            ):
                normalized.append(Token('AND', 'AND'))
        normalized.append(tok)

    return normalized


class BooleanNode:
    def evaluate(self, candidate_terms: Set[str], full_text: str) -> Tuple[bool, Set[str]]:
        raise NotImplementedError


class TermNode(BooleanNode):
    def __init__(self, term: str):
        self.term = term.lower()

    def evaluate(self, candidate_terms: Set[str], full_text: str) -> Tuple[bool, Set[str]]:
        # Check either exact keyword match in tokens, or substring in text
        if self.term in candidate_terms or self.term in full_text:
            return True, {self.term}
        return False, set()

    def __repr__(self):
        return f"TermNode({self.term})"


class NotNode(BooleanNode):
    def __init__(self, child: BooleanNode):
        self.child = child

    def evaluate(self, candidate_terms: Set[str], full_text: str) -> Tuple[bool, Set[str]]:
        matched, matched_terms = self.child.evaluate(candidate_terms, full_text)
        return not matched, set()

    def __repr__(self):
        return f"NotNode({self.child})"


class AndNode(BooleanNode):
    def __init__(self, left: BooleanNode, right: BooleanNode):
        self.left = left
        self.right = right

    def evaluate(self, candidate_terms: Set[str], full_text: str) -> Tuple[bool, Set[str]]:
        left_match, left_terms = self.left.evaluate(candidate_terms, full_text)
        if not left_match:
            return False, set()
        right_match, right_terms = self.right.evaluate(candidate_terms, full_text)
        if not right_match:
            return False, set()
        return True, left_terms.union(right_terms)

    def __repr__(self):
        return f"AndNode({self.left}, {self.right})"


class OrNode(BooleanNode):
    def __init__(self, left: BooleanNode, right: BooleanNode):
        self.left = left
        self.right = right

    def evaluate(self, candidate_terms: Set[str], full_text: str) -> Tuple[bool, Set[str]]:
        left_match, left_terms = self.left.evaluate(candidate_terms, full_text)
        right_match, right_terms = self.right.evaluate(candidate_terms, full_text)
        if left_match or right_match:
            return True, left_terms.union(right_terms)
        return False, set()

    def __repr__(self):
        return f"OrNode({self.left}, {self.right})"


class BooleanParser:
    """
    Standard recursive-descent parser for Boolean queries.
    Grammar:
      expr   := or_expr
      or_expr := and_expr ( 'OR' and_expr )*
      and_expr:= not_expr ( 'AND' not_expr )*
      not_expr:= 'NOT' not_expr | primary
      primary := TERM | '(' expr ')'
    """

    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0

    def current(self) -> Optional[Token]:
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def consume(self, expected_type: Optional[str] = None) -> Optional[Token]:
        tok = self.current()
        if tok is None:
            return None
        if expected_type and tok.type != expected_type:
            return None
        self.pos += 1
        return tok

    def parse(self) -> Optional[BooleanNode]:
        if not self.tokens:
            return None
        node = self.parse_or()
        return node

    def parse_or(self) -> Optional[BooleanNode]:
        node = self.parse_and()
        while self.current() and self.current().type == 'OR':
            self.consume('OR')
            right = self.parse_and()
            if right:
                node = OrNode(node, right)
        return node

    def parse_and(self) -> Optional[BooleanNode]:
        node = self.parse_not()
        while self.current() and self.current().type == 'AND':
            self.consume('AND')
            right = self.parse_not()
            if right:
                node = AndNode(node, right)
        return node

    def parse_not(self) -> Optional[BooleanNode]:
        if self.current() and self.current().type == 'NOT':
            self.consume('NOT')
            child = self.parse_not()
            return NotNode(child) if child else None
        return self.parse_primary()

    def parse_primary(self) -> Optional[BooleanNode]:
        tok = self.current()
        if not tok:
            return None
        if tok.type == 'TERM':
            self.consume('TERM')
            return TermNode(tok.value)
        if tok.type == 'LPAREN':
            self.consume('LPAREN')
            node = self.parse_or()
            if self.current() and self.current().type == 'RPAREN':
                self.consume('RPAREN')
            return node
        self.consume()
        return None


def parse_boolean_query(query: str) -> Optional[BooleanNode]:
    """Convenience helper to tokenize and parse a Boolean search string."""
    tokens = tokenize_boolean_query(query)
    if not tokens:
        return None
    parser = BooleanParser(tokens)
    return parser.parse()


def evaluate_candidate_boolean(
    candidate_data: Dict[str, Any],
    ast: BooleanNode
) -> Tuple[bool, List[str], str]:
    """
    Evaluates a candidate dictionary against a parsed Boolean AST.
    Returns: (is_match, list_of_matched_keywords, evidence_snippet)
    """
    # Build candidate terms set and full search text
    name = (candidate_data.get("full_name") or candidate_data.get("name") or "").lower()
    title = (candidate_data.get("current_title") or candidate_data.get("current_role") or "").lower()
    company = (candidate_data.get("current_company") or "").lower()
    location = (candidate_data.get("location") or "").lower()
    skills = candidate_data.get("skills_list") or candidate_data.get("technical_skills") or []
    if isinstance(skills, str):
        skills_items = [s.strip().lower() for s in skills.split(",") if s.strip()]
    elif isinstance(skills, list):
        skills_items = [str(s).strip().lower() for s in skills if str(s).strip()]
    else:
        skills_items = []

    raw_text = (candidate_data.get("raw_text") or candidate_data.get("summary") or "").lower()

    # Aggregate search text
    full_text = f"{name} {title} {company} {location} {' '.join(skills_items)} {raw_text}"
    candidate_terms = set(skills_items)
    for word in re.findall(r'\b\w+\b', full_text):
        candidate_terms.add(word)

    is_match, matched_terms = ast.evaluate(candidate_terms, full_text)
    matched_list = sorted(list(matched_terms))

    evidence_snippet = ""
    if is_match and matched_list:
        first_match = matched_list[0]
        idx = full_text.find(first_match)
        if idx != -1:
            start = max(0, idx - 40)
            end = min(len(full_text), idx + 80)
            evidence_snippet = f"...{full_text[start:end].strip()}..."

    return is_match, matched_list, evidence_snippet
