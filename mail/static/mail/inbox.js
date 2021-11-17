document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', sent_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(id){

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#see_email').style.display = 'none';
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  // Able inputs
  document.querySelector('#compose-recipients').disabled = false;
  document.querySelector('#compose-subject').disabled = false;
  document.querySelector('#compose-body').disabled = false;
  if (!isNaN(id)){
    fetch('/emails/' + id)
    .then(response => response.json())
    .then(email => {
      const user_id = JSON.parse(document.getElementById('user_id').textContent);
      var users = email['recipients']
      var lista = []
      for (var i = 0; i < users.length; i++){
        if (users[i] !== user_id){
          lista.push(users[i])
        }
      }
      document.querySelector('#compose-recipients').value = `${email['sender']}` + ' ' + `${lista}`;
      document.querySelector('#compose-recipients').disabled = true;
      if (!email['subject'].startsWith('Re:')){
        document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
      } else {
        document.querySelector('#compose-subject').value = email['subject'];
      }
      document.querySelector('#compose-subject').disabled = true;
      document.querySelector('#compose-body').value = `On ${email['timestamp']} ${email['sender']} wrote: ${email['body']}`;
    })
  }
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#see_email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = ` <h3 id="mail_box">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load emails
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const div = document.createElement('div');
      div.className = 'email-box';
      div.innerHTML = `<p> from <b>${email['sender']}</b> - subject <b>${email['subject']}</b> - at <b>${email['timestamp']}</b> </p>`;
      div.addEventListener('click', () => load_email(email['id']));
      // Add color white to unread, grey to read
      if (email['read']){
        div.style.backgroundColor = "grey";
      } else {
        div.style.backgroundColor = "white";
      }
      document.querySelector('#emails-view').appendChild(div);
    });
  });
}

// funcion para enviar un mail
function sent_mail(event){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#see_email').style.display = 'none';

  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(location.reload())
  .then(response => load_mailbox('sent'));
}

// Load a mail with the "id"
function load_email(id){
  // Change email read = True
  fetch('/emails/' + id, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  // See the email info
  fetch('/emails/'+ id)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#see_email').style.display = 'block';

    document.querySelector('#see_email').innerHTML = `
      <div class="border p-2" id="card">
      <p> Sender: ${email['sender']} </p>
      <p> Recipients: ${email['recipients']} </p>
      <p> Subject: ${email['subject']} </p>
      <p> Timestamp: ${email['timestamp']} </p>
      </div>
      <div id="body_mail" class="border p-2">${email['body']}</div>
    `;
    // Button to archived mail
    const arch = document.createElement('button');
    const reply = document.createElement('button');
    const unread = document.createElement('button');
    const user_id = JSON.parse(document.getElementById('user_id').textContent);
    arch.id = "archive";
    arch.className = "button-action";
    reply.id = "reply";
    reply.className = "button-action";
    unread.id = "unread";
    unread.className = "button-action"
    // if user not the sender 
    if (user_id !== email["sender"]){
      // Archive control
      if (!email['archived']) {
        arch.innerHTML = "Archived";
        arch.addEventListener('click', () => fetch('/emails/' + id, {
          method: 'PUT',
          body: JSON.stringify({
              archived: true
          })
        })
        .then(load_mailbox("inbox"))
        .then(location.reload())
        )
      } else {
        arch.innerHTML = "Unarchived"
        arch.addEventListener('click', () => fetch('/emails/' + id, {
          method: 'PUT',
          body: JSON.stringify({
              archived: false
          })
        })
        .then(load_mailbox("inbox"))
        .then(location.reload())
        )
      }
      // Reply email
      reply.innerHTML = "Reply";
      reply.addEventListener('click', () => compose_email(email['id']))
      document.querySelector("#see_email").append(arch, reply);
    }
  if (email['read']){
      unread.innerHTML = "Mark as Unread";
      unread.addEventListener('click', () => fetch('/emails/' + id, {
        method: 'PUT',
        body: JSON.stringify({
          read: false
        })
      })
      .then(load_mailbox("inbox"))
      .then(location.reload())
      )
      document.querySelector("#see_email").append(unread);
    }
  })
}
