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

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#see_email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
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
    //console.log(emails) para ver que imprime en pantalla. Status: OK!
    emails.forEach(email => {
      const div = document.createElement('div');
      div.className = 'email-box';
      div.innerHTML = `<p> from <b>${email['sender']}</b> - subject <b>${email['subject']}</b> - at <b>${email['timestamp']}</b> </p>`;
      div.addEventListener('click', () => load_email(email['id']));
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
  .then(response => load_mailbox('sent'));
}

// Funcion para cargar un mail especifico
function load_email(id){
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
      <p id="body_mail" class="border p-2"> ${email['body']} </p>
    `;
  })
}

