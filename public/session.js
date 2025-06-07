const params = new URLSearchParams(window.location.search);
const sessionId = params.get('id');
const readonly = params.get('readonly') === '1' || params.get('readonly') === 'true';

async function loadSession() {
  const res = await fetch(`/api/sessions/${sessionId}`);
  const data = await res.json();
  document.getElementById('sessionTitle').textContent = `Session ${data.date}`;

  const list = document.getElementById('exerciseList');
  list.innerHTML = '';
  data.exercises.forEach(ex => {
    const div = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = ex.name;
    div.appendChild(h3);
    const ul = document.createElement('ul');
    ex.sets.forEach(s => {
      const li = document.createElement('li');
      li.textContent = `${s.reps} reps @ ${s.weight || 0}`;
      
      if (!readonly && !data.closed) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.style.color = 'red';
        deleteBtn.style.border = 'none';
        deleteBtn.style.background = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', async () => {
          await fetch(`/api/sets/${s.id}`, { method: 'DELETE' });
          loadSession();
        });
        li.appendChild(deleteBtn);
      }
      
      ul.appendChild(li);
    });
    div.appendChild(ul);

    if (!readonly && !data.closed) {
      const form = document.createElement('form');
      const lastValues = JSON.parse(localStorage.getItem(`exercise_${ex.name}`)) || {};
      form.innerHTML = `
        <input type="number" name="weight" placeholder="weight" step="any" value="${lastValues.weight || ''}">
        <input type="number" name="reps" placeholder="reps" required value="${lastValues.reps || ''}">
        <button type="submit">Add Set</button>
      `;
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const weight = form.elements.weight.value;
        const reps = form.elements.reps.value;
        await fetch(`/api/exercises/${ex.id}/sets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight, reps })
        });
        localStorage.setItem(`exercise_${ex.name}`, JSON.stringify({ weight, reps }));
        loadSession();
      });
      div.appendChild(form);
    }

    list.appendChild(div);
  });

  if (readonly || data.closed) {
    document.getElementById('exerciseForm').style.display = 'none';
    document.getElementById('closeButton').style.display = 'none';
  }
}

if (sessionId) {
  loadSession();
}

const exerciseForm = document.getElementById('exerciseForm');
if (exerciseForm) {
  exerciseForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('exerciseName').value;
    await fetch(`/api/sessions/${sessionId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    e.target.reset();
    loadSession();
  });
}

const closeButton = document.getElementById('closeButton');
if (closeButton) {
  closeButton.addEventListener('click', async () => {
    await fetch(`/api/sessions/${sessionId}/close`, { method: 'POST' });
    window.location.href = '/';
  });
}
