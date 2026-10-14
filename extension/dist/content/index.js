var E=Object.defineProperty;var A=(y,e,t)=>e in y?E(y,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):y[e]=t;var C=(y,e,t)=>A(y,typeof e!="symbol"?e+"":e,t);import{g as F,a as h}from"../assets/api_client-D1ryaUrq.js";class B{isCompatible(e){return e.includes("linkedin.com/jobs")||e.includes("linkedin.com/feed")}async extractJob(){var x,f,w,_,v,k;const e=document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24, .jobs-details__main-content h1"),t=(x=e==null?void 0:e.textContent)==null?void 0:x.trim();if(!t)return null;const o=document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__primary-description-container a"),a=((f=o==null?void 0:o.textContent)==null?void 0:f.trim())||"LinkedIn Listing",i=document.querySelector(".job-details-jobs-unified-top-card__primary-description-container, .jobs-unified-top-card__bullet"),d=((w=i==null?void 0:i.textContent)==null?void 0:w.trim())||"Unknown Location",c=document.querySelector(".jobs-description__content, #job-details, .jobs-box__html-content"),u=((_=c==null?void 0:c.textContent)==null?void 0:_.trim())||"",l=new URLSearchParams(window.location.search).get("currentJobId")||window.location.pathname.split("/").filter(Boolean).pop()||"",s=document.querySelector(".jobs-unified-top-card__posted-date, .job-details-jobs-unified-top-card__primary-description-container span"),n=((v=s==null?void 0:s.textContent)==null?void 0:v.trim())||"",b=this.parseRelativeTime(n),p=document.querySelector('.jobs-apply-button, button[data-control-name="jobdetails_topcard_inapply"]'),g=((k=p==null?void 0:p.textContent)==null?void 0:k.trim())||"",m=g.toLowerCase().includes("easy apply")||document.querySelector(".jobs-apply-button--easy-apply")!==null,j=this.extractSkills(u);return{source_id:"linkedin",external_job_id:l,title:t,company:a,location:d,employment_type:"Full-time",description_text:u,skills_required:j,application_url:window.location.href,source_posted_at:b,raw_page_snippets:{apply_button_text:g,has_easy_apply:m,recency_raw:n}}}observeJobChanges(e){let t=window.location.href;new MutationObserver(()=>{window.location.href!==t&&(t=window.location.href,setTimeout(e,800))}).observe(document.body,{childList:!0,subtree:!0})}parseRelativeTime(e){const t=new Date,o=e.toLowerCase(),a=o.match(/(\d+)\s*hour/);if(a)return t.setHours(t.getHours()-parseInt(a[1],10)),t.toISOString();const i=o.match(/(\d+)\s*day/);if(i)return t.setDate(t.getDate()-parseInt(i[1],10)),t.toISOString();const d=o.match(/(\d+)\s*week/);if(d)return t.setDate(t.getDate()-parseInt(d[1],10)*7),t.toISOString()}extractSkills(e){return["Python","JavaScript","TypeScript","React","Node.js","FastAPI","Docker","Kubernetes","PostgreSQL","SQL","AWS","GCP","Azure","Git","REST API","Java","C++","Go","Rust","GraphQL","Next.js","Tailwind","Redis"].filter(o=>new RegExp(`\\b${o}\\b`,"i").test(e))}}class L{isCompatible(e){return e.includes("naukri.com")}async extractJob(){var s,n,b,p,g;const e=document.querySelector(".styles_jds-container__... h1, .jd-header-title, h1.title"),t=(s=e==null?void 0:e.textContent)==null?void 0:s.trim();if(!t)return null;const o=document.querySelector(".styles_comp-name__..., .jd-header-comp-name, .company-name"),a=((n=o==null?void 0:o.textContent)==null?void 0:n.trim())||"Naukri Recruiter",i=document.querySelector(".styles_loc__..., .location, .loc"),d=((b=i==null?void 0:i.textContent)==null?void 0:b.trim())||"India",c=document.querySelector(".styles_job-desc-container__..., .dang-inner-html, .job-desc"),u=((p=c==null?void 0:c.textContent)==null?void 0:p.trim())||"",r=document.querySelector("#apply-button, button.apply-button"),l=((g=r==null?void 0:r.textContent)==null?void 0:g.trim())||"";return{source_id:"naukri",title:t,company:a,location:d,employment_type:"Full-time",description_text:u,skills_required:[],application_url:window.location.href,raw_page_snippets:{apply_button_text:l}}}observeJobChanges(e){let t=window.location.href;new MutationObserver(()=>{window.location.href!==t&&(t=window.location.href,setTimeout(e,800))}).observe(document.body,{childList:!0,subtree:!0})}}class I{isCompatible(e){return!0}async extractJob(){var i,d,c,u;const e=document.querySelectorAll('script[type="application/ld+json"]');for(const r of e)try{const l=JSON.parse(r.textContent||"{}"),s=l["@type"]==="JobPosting"?l:Array.isArray(l["@graph"])?l["@graph"].find(n=>n["@type"]==="JobPosting"):null;if(s)return{source_id:"generic",title:s.title,company:((i=s.hiringOrganization)==null?void 0:i.name)||document.title,location:((c=(d=s.jobLocation)==null?void 0:d.address)==null?void 0:c.addressLocality)||"Not specified",description_text:s.description?this.stripHtml(s.description):"",skills_required:[],application_url:window.location.href,source_posted_at:s.datePosted,raw_page_snippets:{}}}catch{}const t=document.querySelector("h1");if(!t||t.textContent.trim().length<4)return null;const o=t.textContent.trim(),a=document.body.innerText.slice(0,4e3);return{source_id:"generic",title:o,company:((u=document.title.split("-")[0])==null?void 0:u.trim())||"Company",description_text:a,skills_required:[],application_url:window.location.href,raw_page_snippets:{}}}observeJobChanges(e){}stripHtml(e){const t=document.createElement("div");return t.innerHTML=e,t.textContent||t.innerText||""}}class q{constructor(){C(this,"container",null)}render(e){var a,i;this.container&&this.container.remove();const t=document.createElement("div");t.id="ai-job-assistant-badge",t.style.position="fixed",t.style.bottom="24px",t.style.right="24px",t.style.zIndex="999999",t.style.fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',t.style.backgroundColor="rgba(15, 23, 42, 0.92)",t.style.backdropFilter="blur(16px)",t.style.border="1px solid rgba(255, 255, 255, 0.12)",t.style.borderRadius="16px",t.style.padding="18px 20px",t.style.color="#F8FAFC",t.style.boxShadow="0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)",t.style.width="320px",t.style.animation="aiBadgeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)";const o=e.match.match_score>=80?"#10B981":e.match.match_score>=60?"#F59E0B":"#EF4444";t.innerHTML=`
      <style>
        @keyframes aiBadgeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-btn-primary {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }
        .ai-btn-primary:hover {
          filter: brightness(1.1);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .ai-badge-close {
          cursor: pointer;
          color: #94A3B8;
          font-size: 16px;
          line-height: 1;
        }
        .ai-badge-close:hover {
          color: white;
        }
      </style>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #38BDF8; box-shadow: 0 0 8px #38BDF8;"></div>
          <span style="font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; color: #94A3B8;">AI Job Match</span>
        </div>
        <span class="ai-badge-close" id="ai-badge-close-btn">&times;</span>
      </div>

      <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px;">
        <span style="font-size: 32px; font-weight: 800; color: ${o}; font-feature-settings: 'tnum';">${e.match.match_score}%</span>
        <span style="font-size: 12px; font-weight: 600; color: #CBD5E1; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 20px;">
          ${this.formatMethod(e.method)}
        </span>
      </div>

      <p style="font-size: 12px; line-height: 1.5; color: #94A3B8; margin: 0 0 14px 0;">
        ${e.match.summary_explanation.slice(0,110)}...
      </p>

      <div style="display: flex; gap: 8px;">
        <button class="ai-btn-primary" id="ai-badge-prepare-btn">Prepare Application</button>
      </div>
    `,document.body.appendChild(t),this.container=t,(a=document.getElementById("ai-badge-close-btn"))==null||a.addEventListener("click",()=>{this.remove()}),(i=document.getElementById("ai-badge-prepare-btn"))==null||i.addEventListener("click",()=>{e.onPrepare()})}remove(){this.container&&(this.container.remove(),this.container=null)}formatMethod(e){switch(e){case"EMAIL":return"✉️ Email Application";case"WEBSITE_FORM":return"📝 Website Form";case"RECRUITER_MESSAGE":return"💬 Recruiter Message";case"EXTERNAL_PORTAL":return"🌐 External ATS";default:return"❓ Method Unclear"}}}const R=new q;class T{findFormFields(){const e=[];return document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select').forEach(o=>{const a="readOnly"in o&&o.readOnly;if(o.offsetParent===null||o.disabled||a)return;const i=this.resolveLabel(o),d=this.classifyField(o,i),c=o.required||o.getAttribute("aria-required")==="true"||i.includes("*"),u="maxLength"in o&&o.maxLength>0?o.maxLength:void 0;e.push({element:o,fieldType:d,label:i,isRequired:c,maxChars:u})}),e}resolveLabel(e){var o,a;if(e.getAttribute("aria-label"))return e.getAttribute("aria-label");if(e.id){const i=document.querySelector(`label[for="${e.id}"]`);if(i)return((o=i.textContent)==null?void 0:o.trim())||""}const t=e.closest("label");return t?((a=t.textContent)==null?void 0:a.trim())||"":"placeholder"in e&&e.placeholder?e.placeholder:e.getAttribute("name")&&e.getAttribute("name")||""}classifyField(e,t){const o=`${t} ${e.getAttribute("name")||""} ${e.getAttribute("id")||""} ${e.getAttribute("autocomplete")||""}`.toLowerCase();return o.includes("first name")||o.includes("given name")||o.includes("fname")?"first_name":o.includes("last name")||o.includes("family name")||o.includes("surname")||o.includes("lname")?"last_name":o.includes("full name")||o.includes("candidate name")||o.includes("your name")?"full_name":o.includes("email")||e.type==="email"?"email":o.includes("phone")||o.includes("mobile")||e.type==="tel"?"phone":o.includes("linkedin")?"linkedin":o.includes("github")?"github":o.includes("portfolio")||o.includes("website")?"portfolio":e.tagName.toLowerCase()==="textarea"||t.length>25?"question":"unknown"}}const M=new T;class P{injectProfileData(e,t,o=[]){let a=0,i=0;const d=t.links||{},c=t.headline||"Candidate",[u,...r]=c.split(" "),l=r.join(" ");return e.forEach(s=>{let n=null;switch(s.fieldType){case"first_name":n=u||null;break;case"last_name":n=l||null;break;case"full_name":n=c;break;case"email":n=t.user_id?"applicant@example.com":null;break;case"phone":n=t.phone||null;break;case"linkedin":n=d.linkedin||null;break;case"github":n=d.github||null;break;case"portfolio":n=d.portfolio||null;break;case"question":{const b=o.find(p=>p.field_id===s.element.id||s.label.toLowerCase().includes(p.field_id.toLowerCase()));b&&(n=b.answer);break}}n?(this.setNativeValue(s.element,n),this.highlightField(s.element,"filled"),a++):s.isRequired&&(this.highlightField(s.element,"missing"),i++)}),{filledCount:a,missingRequired:i}}setNativeValue(e,t){var i;const o=Object.getPrototypeOf(e),a=(i=Object.getOwnPropertyDescriptor(o,"value"))==null?void 0:i.set;a?a.call(e,t):e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("blur",{bubbles:!0}))}highlightField(e,t){t==="filled"?(e.style.transition="box-shadow 0.3s ease, border-color 0.3s ease",e.style.borderColor="#10B981",e.style.boxShadow="0 0 0 2px rgba(16, 185, 129, 0.2)"):(e.style.transition="box-shadow 0.3s ease, border-color 0.3s ease",e.style.borderColor="#F59E0B",e.style.boxShadow="0 0 0 2px rgba(245, 158, 11, 0.2)")}}const z=new P;async function S(){if(!await F())return;const e=[new B,new L,new I],t=window.location.href,o=e.find(r=>r.isCompatible(t))||e[2];let a=null,i="WEBSITE_FORM";async function d(){try{const r=await o.extractJob();if(!r||!r.title)return;const l=await h.ingestJob(r),s=l.match;a=l.job.id,i=l.workflow.method,R.render({match:s,method:i,onPrepare:c,onSave:async()=>{a&&await h.toggleSaveJob(a)}})}catch(r){console.warn("AI Assistant job extraction skipped:",r)}}async function c(){if(a)try{if(i==="WEBSITE_FORM"){const r=M.findFormFields(),l=r.filter(m=>m.fieldType==="question").map(m=>({field_id:m.element.id||m.label,question:m.label,max_chars:m.maxChars})),s=await h.draftWorkflow(a,"WEBSITE_FORM",l),n=await h.getProfile(),b=(s.form_qa_answers||[]).map(m=>({field_id:m.field_id,answer:m.answer})),{filledCount:p,missingRequired:g}=z.injectProfileData(r,n,b);alert(`Application Form Staged:
• ${p} fields populated
• ${g} required fields need manual attention

Note: Please review all fields and click Submit manually when ready.`)}else{const r=await h.draftWorkflow(a,i);u(r,i)}}catch(r){alert(`Error preparing application: ${r.message}`)}}function u(r,l){var p,g;const s=document.getElementById("ai-draft-review-modal");s&&s.remove();const n=document.createElement("div");n.id="ai-draft-review-modal",n.style.position="fixed",n.style.inset="0",n.style.backgroundColor="rgba(0, 0, 0, 0.75)",n.style.backdropFilter="blur(8px)",n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.zIndex="1000000",n.style.fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';let b="";l==="EMAIL"&&r.email_draft?b=`
        <h3 style="margin-top: 0; color: #F8FAFC;">✉️ Prepared Email Application</h3>
        <p style="font-size: 13px; color: #94A3B8;">Review the tailored email before sending with your client.</p>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">Recipient</label>
          <input type="text" readonly value="${r.email_draft.to}" style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">Subject Line</label>
          <input type="text" readonly value="${r.email_draft.subject}" style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">Cover Email Body</label>
          <textarea rows="7" readonly style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box; resize: vertical;">${r.email_draft.body}</textarea>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="ai-modal-copy-btn" style="background: #3B82F6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Copy Email Body</button>
          <button id="ai-modal-close-btn" style="background: #334155; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
      `:l==="RECRUITER_MESSAGE"&&r.recruiter_message_draft&&(b=`
        <h3 style="margin-top: 0; color: #F8FAFC;">💬 Recruiter Outreach Note</h3>
        <p style="font-size: 13px; color: #94A3B8;">Character count: ${r.recruiter_message_draft.char_count} / 300</p>
        <textarea rows="4" readonly style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box;">${r.recruiter_message_draft.message}</textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
          <button id="ai-modal-copy-btn" style="background: #3B82F6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Copy Message</button>
          <button id="ai-modal-close-btn" style="background: #334155; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
      `),n.innerHTML=`
      <div style="background: #0F172A; border: 1px solid #334155; border-radius: 16px; padding: 24px; width: 480px; max-width: 90vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        ${b}
      </div>
    `,document.body.appendChild(n),(p=document.getElementById("ai-modal-close-btn"))==null||p.addEventListener("click",()=>n.remove()),(g=document.getElementById("ai-modal-copy-btn"))==null||g.addEventListener("click",()=>{const m=l==="EMAIL"?r.email_draft.body:r.recruiter_message_draft.message;navigator.clipboard.writeText(m),alert("Copied to clipboard! You can paste and send manually."),n.remove()})}d(),o.observeJobChanges(d)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",S):S();
