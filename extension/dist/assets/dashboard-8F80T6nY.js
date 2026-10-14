import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as s,b as T,s as P}from"./api_client-D1ryaUrq.js";document.addEventListener("DOMContentLoaded",async()=>{var _,I,L,$,k;const f=document.querySelectorAll(".nav-item"),B=document.querySelectorAll(".view-section");f.forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-view");f.forEach(a=>a.classList.remove("active")),e.classList.add("active"),B.forEach(a=>{a.id===`view-${t}`?a.style.display="block":a.style.display="none"}),t==="feed"&&r(),t==="tracker"&&w(),t==="profile"&&y()})});let g="all",b="best_match",x="";await S(),await r();async function S(){try{const e=await s.getMe(),t=document.getElementById("sidebar-user-name"),a=document.getElementById("avatar-initials");t&&(t.textContent=e.full_name||e.email),a&&(a.textContent=(e.full_name||"U").charAt(0).toUpperCase())}catch{console.log("User not signed in via extension yet.")}}const E=document.querySelectorAll("#recency-chips button");E.forEach(e=>{e.addEventListener("click",()=>{E.forEach(t=>t.classList.remove("active")),e.classList.add("active"),g=e.getAttribute("data-recency")||"all",r()})});const c=document.getElementById("sort-jobs-select");c==null||c.addEventListener("change",()=>{b=c.value,r()});const p=document.getElementById("search-jobs-input");let h;p==null||p.addEventListener("input",()=>{clearTimeout(h),h=setTimeout(()=>{x=p.value,r()},300)});async function r(){const e=document.getElementById("jobs-container");if(e){e.innerHTML='<div style="color: var(--text-secondary); grid-column: 1/-1; padding: 40px; text-align: center;">Loading jobs...</div>';try{const t=await T(),a=await s.getJobs({recency_window:g,sort_by:b,search:x,min_match_score:t.minMatchScore});if(a.length===0){e.innerHTML=`
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
            <div style="font-size: 16px; font-weight: 700; color: white;">No matching jobs found</div>
            <p style="font-size: 13px; margin-top: 6px;">Browse LinkedIn or Naukri, or click "+ Add Job Manually" to test matching.</p>
          </div>
        `;return}e.innerHTML=a.map(o=>D(o)).join(""),R(a)}catch(t){e.innerHTML=`<div style="color: var(--accent-rose); grid-column: 1/-1; padding: 20px;">Failed to load jobs: ${t.message}</div>`}}}function D(e){var n,i;const t=((n=e.match)==null?void 0:n.match_score)||0,a=t>=80?"score-high":t>=60?"score-mid":"score-low",o=e.source_posted_at?`Posted: ${new Date(e.source_posted_at).toLocaleDateString()}`:`Discovered: ${new Date(e.discovered_at).toLocaleDateString()}`;return`
      <div class="job-card" data-job-id="${e.id}">
        <div class="job-top">
          <div>
            <h3 class="job-title">${e.title}</h3>
            <div class="job-company">${e.company} • ${e.location||"Remote"}</div>
          </div>
          <span class="score-pill ${a}">${t}% Fit</span>
        </div>

        <div class="job-meta">
          <span class="meta-tag">📅 ${o}</span>
          <span class="meta-tag">🌐 ${e.source_id.toUpperCase()}</span>
          <span class="meta-tag">💼 ${u(e.detected_method||"WEBSITE_FORM")}</span>
        </div>

        <div class="job-match-reason">
          ${((i=e.match)==null?void 0:i.summary_explanation)||"Match calculated based on candidate skills and role preference."}
        </div>

        <div class="job-actions">
          <button class="btn-action-primary btn-prepare-app" data-id="${e.id}">Prepare Application</button>
          ${e.application_url?`<a href="${e.application_url}" target="_blank" class="btn-action-secondary" style="text-decoration: none;">View ↗</a>`:""}
          <button class="btn-action-secondary btn-save-job" data-id="${e.id}">${e.is_saved?"★":"☆"}</button>
        </div>
      </div>
    `}function u(e){switch(e){case"EMAIL":return"Email Apply";case"RECRUITER_MESSAGE":return"Recruiter Note";case"EXTERNAL_PORTAL":return"External Portal";default:return"Form Autofill"}}function R(e){document.querySelectorAll(".btn-prepare-app").forEach(t=>{t.addEventListener("click",a=>{const o=a.currentTarget.getAttribute("data-id"),n=e.find(i=>i.id===o);n&&z(n)})}),document.querySelectorAll(".btn-save-job").forEach(t=>{t.addEventListener("click",async a=>{const o=a.currentTarget,n=o.getAttribute("data-id");if(n){const i=await s.toggleSaveJob(n);o.textContent=i.is_saved?"★":"☆"}})})}const d=document.getElementById("workflow-modal"),m=document.getElementById("workflow-modal-body");async function z(e){var t;d.style.display="flex",m.innerHTML=`
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 24px; margin-bottom: 12px;">⚡</div>
        <h3>Drafting Tailored Application...</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-top: 6px;">
          Grounding answers strictly in verified candidate profile facts.
        </p>
      </div>
    `;try{const a=await s.draftWorkflow(e.id,e.detected_method);M(e,a)}catch(a){m.innerHTML=`
        <h3 style="color: var(--accent-rose);">Drafting Failed</h3>
        <p style="color: var(--text-secondary); margin: 12px 0;">${a.message}</p>
        <button class="btn-action-secondary" id="modal-close-btn">Close</button>
      `,(t=document.getElementById("modal-close-btn"))==null||t.addEventListener("click",()=>d.style.display="none")}}function M(e,t){var n,i,l;const a=t.workflow_type==="EMAIL",o=t.workflow_type==="RECRUITER_MESSAGE";m.innerHTML=`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 800;">${e.title}</h2>
          <div style="font-size: 13px; color: var(--accent-cyan); font-weight: 600;">${e.company}</div>
        </div>
        <button id="modal-close-x" style="background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; margin-bottom: 20px;">
        <label style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-dim); display: block; margin-bottom: 6px;">Application Method</label>
        <span style="font-size: 13px; font-weight: 600; color: white;">${u(t.workflow_type)}</span>
      </div>

      ${a&&t.email_draft?`
        <div style="margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">Recipient</label>
          <input type="text" class="search-input" readonly value="${t.email_draft.to}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">Subject Line</label>
          <input type="text" class="search-input" readonly value="${t.email_draft.subject}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">Email Body</label>
          <textarea rows="8" class="search-input" readonly style="width: 100%; resize: vertical;">${t.email_draft.body}</textarea>
        </div>
      `:""}

      ${o&&t.recruiter_message_draft?`
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">
            Connection Note (${t.recruiter_message_draft.char_count} / 300 characters)
          </label>
          <textarea rows="4" class="search-input" readonly style="width: 100%; resize: vertical;">${t.recruiter_message_draft.message}</textarea>
        </div>
      `:""}

      ${!a&&!o&&t.form_qa_answers?`
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 8px;">
            Fact-Grounded Form Answers
          </label>
          ${t.form_qa_answers.map(A=>`
            <div style="margin-bottom: 12px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 10px;">
              <div style="font-size: 12px; font-weight: 700; margin-bottom: 4px;">${A.question}</div>
              <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${A.answer}</div>
            </div>
          `).join("")}
        </div>
      `:""}

      <div style="border-top: 1px solid var(--border-subtle); padding-top: 18px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; color: var(--text-dim);">
          ⚠️ Final submission is manual. Verify before sending.
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-action-primary" id="btn-confirm-applied">✓ Confirm Applied Manually</button>
          <button class="btn-action-secondary" id="modal-close-btn">Close</button>
        </div>
      </div>
    `,(n=document.getElementById("modal-close-x"))==null||n.addEventListener("click",()=>d.style.display="none"),(i=document.getElementById("modal-close-btn"))==null||i.addEventListener("click",()=>d.style.display="none"),(l=document.getElementById("btn-confirm-applied"))==null||l.addEventListener("click",async()=>{await s.updateApplicationStatus(t.application_id,"APPLIED"),d.style.display="none",alert("Application tracked as APPLIED! Good luck."),r()})}(_=document.getElementById("btn-manual-job-add"))==null||_.addEventListener("click",()=>{var e,t;d.style.display="flex",m.innerHTML=`
      <h3 style="margin-bottom: 16px;">Add Job Manually</h3>
      <form id="manual-job-form">
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Job Title</label>
          <input type="text" id="manual-title" class="search-input" style="width: 100%;" required placeholder="Senior Software Engineer">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Company</label>
          <input type="text" id="manual-company" class="search-input" style="width: 100%;" required placeholder="Google / Stripe">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Job Description</label>
          <textarea id="manual-desc" rows="6" class="search-input" style="width: 100%; resize: vertical;" required placeholder="Paste full job description..."></textarea>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="submit" class="btn-action-primary" id="btn-save-manual">Calculate Match & Save</button>
          <button type="button" class="btn-action-secondary" id="manual-cancel-btn">Cancel</button>
        </div>
      </form>
    `,(e=document.getElementById("manual-cancel-btn"))==null||e.addEventListener("click",()=>d.style.display="none"),(t=document.getElementById("manual-job-form"))==null||t.addEventListener("submit",async a=>{a.preventDefault();const o=document.getElementById("manual-title").value,n=document.getElementById("manual-company").value,i=document.getElementById("manual-desc").value;try{await s.ingestJob({source_id:"manual",title:o,company:n,description_text:i,skills_required:[],raw_page_snippets:{}}),d.style.display="none",r()}catch(l){alert(`Failed to save job: ${l.message}`)}})});async function w(){const e=document.getElementById("tracker-table-body");if(e){e.innerHTML='<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">Loading applications...</td></tr>';try{const t=await s.listApplications();if(t.length===0){e.innerHTML='<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">No applications tracked yet. Discovered jobs can be prepared and tracked here.</td></tr>';return}e.innerHTML=t.map(a=>{var o,n;return`
        <tr>
          <td>
            <div style="font-weight: 700;">${((o=a.job)==null?void 0:o.title)||"Job Application"}</div>
            <div style="font-size: 12px; color: var(--accent-cyan);">${((n=a.job)==null?void 0:n.company)||""}</div>
          </td>
          <td><span style="font-size: 12px;">${u(a.detected_method)}</span></td>
          <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
          <td style="color: var(--text-secondary); font-size: 12px;">${a.applied_at?new Date(a.applied_at).toLocaleDateString():"Not yet"}</td>
          <td style="color: var(--text-secondary); font-size: 12px;">${a.next_followup_at?new Date(a.next_followup_at).toLocaleDateString():"None scheduled"}</td>
          <td>
            <select class="app-status-select" data-id="${a.id}" style="padding: 6px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 12px;">
              <option value="NEW" ${a.status==="NEW"?"selected":""}>NEW</option>
              <option value="SHORTLISTED" ${a.status==="SHORTLISTED"?"selected":""}>SHORTLISTED</option>
              <option value="READY_TO_APPLY" ${a.status==="READY_TO_APPLY"?"selected":""}>READY_TO_APPLY</option>
              <option value="DRAFTED" ${a.status==="DRAFTED"?"selected":""}>DRAFTED</option>
              <option value="APPLIED" ${a.status==="APPLIED"?"selected":""}>APPLIED</option>
              <option value="INTERVIEW" ${a.status==="INTERVIEW"?"selected":""}>INTERVIEW</option>
              <option value="OFFER" ${a.status==="OFFER"?"selected":""}>OFFER</option>
              <option value="REJECTED" ${a.status==="REJECTED"?"selected":""}>REJECTED</option>
            </select>
          </td>
        </tr>
      `}).join(""),document.querySelectorAll(".app-status-select").forEach(a=>{a.addEventListener("change",async o=>{const n=o.currentTarget,i=n.getAttribute("data-id");i&&(await s.updateApplicationStatus(i,n.value),w())})})}catch(t){e.innerHTML=`<tr><td colspan="6" style="color: var(--accent-rose); padding: 20px;">Failed to load tracker: ${t.message}</td></tr>`}}}(I=document.getElementById("btn-export-csv"))==null||I.addEventListener("click",async()=>{const e=await T();window.open(`${e.apiBaseUrl}/applications/export/csv?token=${e.token}`,"_blank")});async function y(){try{const e=await s.getProfile();document.getElementById("profile-headline").value=e.headline||"",document.getElementById("profile-phone").value=e.phone||"";const t=(e.skills||[]).map(n=>typeof n=="string"?n:n.name).join(", ");document.getElementById("profile-skills").value=t,document.getElementById("profile-verified-facts").value=JSON.stringify(e.verified_facts||{},null,2);const a=await s.listResumes(),o=document.getElementById("resumes-list-container");a.length===0?o.innerHTML='<div style="font-size: 12px; color: var(--text-secondary);">No resume versions uploaded.</div>':o.innerHTML=a.map(n=>`
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 10px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px; font-weight: 600;">${n.version_name}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">${n.filename}</div>
            </div>
            ${n.is_primary?'<span style="font-size: 10px; background: rgba(56,189,248,0.2); color: var(--accent-cyan); padding: 2px 6px; border-radius: 10px;">Primary</span>':""}
          </div>
        `).join("")}catch(e){console.warn("Profile load error:",e)}}(L=document.getElementById("save-profile-btn"))==null||L.addEventListener("click",async()=>{const e=document.getElementById("profile-headline").value,t=document.getElementById("profile-phone").value,a=document.getElementById("profile-skills").value,o=document.getElementById("profile-verified-facts").value,n=a.split(",").map(l=>l.trim()).filter(Boolean).map(l=>({name:l}));let i={};try{i=JSON.parse(o)}catch{}try{await s.updateProfile({headline:e,phone:t,skills:n,verified_facts:i}),alert("Candidate Profile updated successfully!")}catch(l){alert(`Failed to save profile: ${l.message}`)}}),($=document.getElementById("resume-upload-form"))==null||$.addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("resume-file-input"),a=document.getElementById("resume-version-name");if(!t.files||t.files.length===0)return;const o=new FormData;o.append("file",t.files[0]),o.append("version_name",a.value||"Main Resume"),o.append("is_primary","true");try{const n=document.getElementById("upload-resume-btn");n.textContent="Parsing Resume Facts...";const i=await s.uploadResume(o);alert(i.message),y()}catch(n){alert(`Resume upload failed: ${n.message}`)}finally{document.getElementById("upload-resume-btn").textContent="Upload & Parse"}});const v=document.getElementById("save-settings-btn");v==null||v.addEventListener("click",async()=>{const e=document.getElementById("settings-api-url").value,t=parseInt(document.getElementById("settings-min-score").value,10);await P({apiBaseUrl:e,minMatchScore:isNaN(t)?70:t}),alert("Settings saved!")}),(k=document.getElementById("btn-delete-all-data"))==null||k.addEventListener("click",async()=>{confirm("Are you sure you want to permanently delete all profile facts, stored resumes, and application records?")&&(await s.deleteProfile(),alert("All stored data has been erased."),y(),r())})});
