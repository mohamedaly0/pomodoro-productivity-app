// localTasks.js
class LocalTaskManager { constructor(deps){ this.storageKey='pomo_tasks_v1'; this.tasks=[]; this.currentTaskId=null; this.deps=deps; this.listEl=document.getElementById('taskList'); this.inputEl=document.getElementById('taskInput'); this.addBtn=document.getElementById('addTaskBtn'); this.load(); this.bind(); this.render(); }
 load(){ try{ const raw=localStorage.getItem(this.storageKey); if(raw) this.tasks=JSON.parse(raw);}catch(e){ console.warn('Failed to load tasks',e);} }
 save(){ localStorage.setItem(this.storageKey,JSON.stringify(this.tasks)); }
 bind(){ this.addBtn?.addEventListener('click',()=>this.addFromInput()); this.inputEl?.addEventListener('keydown',e=>{ if(e.key==='Enter') this.addFromInput(); }); this.listEl?.addEventListener('click',e=>{ const btn=e.target.closest('button[data-action]'); if(!btn)return; const id=btn.closest('.task-item')?.dataset.id; if(!id)return; if(btn.dataset.action==='select') this.select(id); else if(btn.dataset.action==='toggle') this.toggle(id); else if(btn.dataset.action==='delete') this.delete(id); }); }
 addFromInput(){ const title=this.inputEl.value.trim(); if(!title)return; this.addTask(title); this.inputEl.value=''; }
 addTask(title){ const task={ id:String(Date.now()), title, completed:false, pomodoros:0, createdAt:new Date().toISOString() }; this.tasks.unshift(task); if(!this.currentTaskId) this.currentTaskId=task.id; this.save(); this.render(); }
 select(id){ this.currentTaskId=id; this.render(); }
 toggle(id){ const t=this.tasks.find(t=>t.id===id); if(!t)return; t.completed=!t.completed; if(t.completed && this.deps?.timer?.onTaskCompleted){ this.deps.timer.onTaskCompleted(t);} this.save(); this.render(); }
 delete(id){ this.tasks=this.tasks.filter(t=>t.id!==id); if(this.currentTaskId===id) this.currentTaskId=this.tasks[0]?.id||null; this.save(); this.render(); }
 incrementPomodoroForCurrent(){ const t=this.tasks.find(t=>t.id===this.currentTaskId); if(t){ t.pomodoros+=1; this.save(); this.render(); } }
 render(){ if(!this.listEl)return; if(!this.tasks.length){ this.listEl.innerHTML='<p class="empty">No tasks yet. Add one above.</p>'; return;} this.listEl.innerHTML=this.tasks.map(t=>`<div class=\"task-item ${t.id===this.currentTaskId?'selected':''}\" data-id=\"${t.id}\"><div class=\"task-main\"><div class=\"task-title ${t.completed?'done':''}\">${t.title}</div><div class=\"task-meta\">${t.pomodoros} pomodoro${t.pomodoros===1?'':'s'}</div></div><div class=\"task-actions\"><button data-action=\"select\" title=\"Focus\">🎯</button><button data-action=\"toggle\" title=\"Complete\">${t.completed?'↩️':'✅'}</button><button data-action=\"delete\" title=\"Delete\">🗑️</button></div></div>`).join(''); }
}
window.LocalTaskManager=LocalTaskManager;
