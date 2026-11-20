with open("frontend/src/components/documents/JobWorkspace.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Normalize CRLF
content_unified = content.replace("\r\n", "\n")

target = """                filteredJds.map((jd) => {
                  const isSelected = selectedJd?.id === jd.id;
                  return (
                    <div
                      key={jd.id}
                      onClick={() => setSelectedJd(jd)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 relative ${
                        isSelected
                          ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-surface-darkCard border-slate-200/80 dark:border-surface-darkBorder hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {jd.req_code}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            v1
                          </span>
                          <span className="text-slate-400 font-normal">
                            {jd.department || 'Engineering & Delivery'}
                          </span>
                        </div>

                        <select
                          value={jd.status || 'Under Review'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            jd.status = e.target.value;
                            setJds([...jds]);
                            triggerToast(`Updated ${jd.req_code} status to ${e.target.value}`);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="Under Review">Under Review</option>
                          <option value="Active">Active</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-navy-900 dark:text-slate-100 text-xs line-clamp-1">
                        {jd.title}
                      </h4>

                      {/* Description Snippet */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {jd.description || 'Enterprise solution delivery, architecture and development scope.'}
                      </p>

                      {/* Footer Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{jd.location || 'Hyderabad / Remote'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>5 - 8 Years</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJd(jd);
                            setActiveTab('specs');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Analyze JD &gt;</span>
                        </button>
                      </div>
                    </div>
                  );
                })"""

replacement = """                filteredJds.map((jd) => {
                  const isSelected = selectedJd?.id === jd.id;
                  return (
                    <div
                      key={jd.id}
                      onClick={() => setSelectedJd(jd)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2.5 relative ${
                        isSelected
                          ? 'bg-white dark:bg-surface-darkCard border-2 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-white dark:bg-surface-darkCard border border-slate-200/80 dark:border-surface-darkBorder hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono">
                            {jd.req_code}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-[11px] font-bold border border-blue-200/60 dark:border-blue-800/60">
                            v1
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-[170px]">
                            {jd.department || 'Engineering & Delivery'}
                          </span>
                        </div>

                        <div className="relative">
                          <select
                            value={jd.status || 'Under Review'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              jd.status = e.target.value;
                              setJds([...jds]);
                              triggerToast(`Updated ${jd.req_code} status to ${e.target.value}`);
                            }}
                            className="appearance-none pl-2.5 pr-6 py-1 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer focus:outline-none"
                          >
                            <option value="Under Review">Under Review</option>
                            <option value="Active">Active</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1.5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight leading-snug">
                        {jd.title}
                      </h4>

                      {/* Description Snippet */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {jd.description || 'Enterprise solution delivery, architecture and development scope.'}
                      </p>

                      {/* Footer Row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{jd.location || 'Hyderabad / Remote'}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>5 - 8 Years</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJd(jd);
                            setActiveTab('specs');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Analyze JD</span>
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  );
                })"""

if target in content_unified:
    updated = content_unified.replace(target, replacement)
    with open("frontend/src/components/documents/JobWorkspace.jsx", "w", encoding="utf-8") as f:
        f.write(updated)
    print("SUCCESS: Updated JobWorkspace.jsx card layout!")
else:
    print("ERROR: Target block not found in JobWorkspace.jsx")
