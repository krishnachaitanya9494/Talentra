from backend.app.routers.documents import DynamicQuestionItem


def test_generated_screening_questions_require_recruiter_approval():
    question = DynamicQuestionItem(
        id="sq-1",
        category="Technical",
        recommended_stage="Technical Round",
        difficulty="Intermediate",
        question="Describe a recent relevant project.",
        model_answer="Not provided.",
        expected_signals=[],
        rubric={},
        red_flags=[],
    )

    assert question.review_status == "pending_review"
