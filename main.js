// Initialize Supabase client
const supabaseUrl = 'https://gixsylknwstdekjfvnlc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeHN5bGtud3N0ZGVramZ2bmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE1ODAyOTQsImV4cCI6MjAzNzE1NjI5NH0.byzzFJaeGPf6lLaaKhhOZuaqSf2sya7QJvHq9jD0XEI';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function fetchEssays() {
    // Fetch essays from Supabase
    const { data, error } = await supabase
        .from('essays')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching essays:', error);
        return;
    }

    const essayList = document.getElementById('essay-list');
    data.forEach(essay => {
        const li = document.createElement('li');
        li.className = 'essay-item';
        li.innerHTML = `
            <a href="essay.html?id=${essay.id}" class="essay-link">${essay.title} (${essay.date})</a>
            <button class="toggle-read ${essay.read ? 'read' : ''}" data-id="${essay.id}">✓</button>
        `;
        essayList.appendChild(li);
    });

    // Add event listeners to toggle buttons
    document.querySelectorAll('.toggle-read').forEach(button => {
        button.addEventListener('click', toggleRead);
    });
}

async function toggleRead(event) {
    const button = event.target;
    const essayId = button.dataset.id;
    const currentStatus = button.classList.contains('read');

    // Update read status in Supabase
    const { data, error } = await supabase
        .from('essays')
        .update({ read: !currentStatus })
        .eq('id', essayId);

    if (error) {
        console.error('Error updating read status:', error);
        return;
    }

    // Toggle button appearance
    button.classList.toggle('read');
}

fetchEssays();