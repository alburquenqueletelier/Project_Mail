document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => {
    history.pushState({state : 'inbox'}, "inbox", 'inbox');
    load_mailbox('inbox');
  });
  document.querySelector('#sent').addEventListener('click', () => {
    history.pushState({state : 'sent'}, "", 'sent');
    load_mailbox('sent');
  });
  document.querySelector('#archived').addEventListener('click', () => {
    history.pushState({state : 'archive'}, "", 'archived');
    load_mailbox('archive');
  });
  document.querySelector('#compose').addEventListener('click', () => {
    history.pushState({state : 'compose'}, "", 'compose');
    compose_email();
  });
  document.querySelector('#compose-form').addEventListener('submit', () => {
    history.pushState({}, '', '/');
    sent_mail();
  });
  // By default, load the inbox
  document.querySelector('#inbox').click();

  window.onpopstate = function(event) {
    event.preventDefault;
    const mailbox = event.state.state;
    //console.log(event);
    if (event.state.state !== 'compose'){
      load_mailbox(`${mailbox}`);
    } else {
      compose_email();
    }
  }

});

function reloadpage(){
  const urlreload = window.location.href;
  const split = urlreload.split('/')
  // Genera la url deseada que sería http://127.0.0.1:8000/
  //let load = split.reduce((b,c) => b+c, '');
  const last = split[split.length-1]
  const load = last.search('-')
  if (load < 0){
    document.querySelector(`#${load}`).click();
  } else {
    let slice = last.slice(0,load).includes('a') ? last.slice(0,load) + 'd' : last.slice(0,load);
    document.querySelector(`#${slice}`).click();
  }
}


function compose_email(id){
  //history.pushState({}, '', '/');
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
      document.querySelector('#compose-body').value.focus() = `On ${email['timestamp']} ${email['sender']} wrote: ${email['body']}`;
      document.getElementById('compose-body').focus();
    })
  } else {
    document.getElementById('compose-recipients').focus();
  }
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#see_email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = ` <h3 class="mail_box">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load emails
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const div = document.createElement('div');
      div.className = 'email-box';
      div.innerHTML = `<p> from <b>${email['sender']}</b> - subject <b>${email['subject']}</b> - at <b>${email['timestamp']}</b> </p>`;
      div.addEventListener('click', () => {
        history.pushState({state : mailbox}, "", `${mailbox}-${email['id']}`);
        load_email(email['id'])
      });
      // Add color white to unread, grey to read
      if (email['read']){
        div.style.backgroundColor = "rgb(204, 201, 205)";
      } else {
        div.style.backgroundColor = "white";
      }
      document.querySelector('#emails-view').appendChild(div);
    });
  });
}

// funcion para enviar un mail
function sent_mail(){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#see_email').style.display = 'none';

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
  });
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
      <div id="card">
      <ul class="list-group">
        <li class="list-group-item list-group-item-secondary"> <strong> Sender: </strong> ${email['sender']} </li>
        <li class="list-group-item list-group-item-secondary"> <strong>Recipients: </strong> ${email['recipients']} </li>
        <li class="list-group-item list-group-item-secondary"> <strong> Subject: </strong> ${email['subject']} </li>
        <li class="list-group-item list-group-item-secondary"> <strong>Timestamp: </strong> ${email['timestamp']} </li>
      </ul>
      </div>
      <div id="body_mail" class="border border-primary p-2">${email['body']}</div>
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
        )
      }
      // Reply email
      reply.innerHTML = "Reply";
      reply.addEventListener('click', () => {
        history.pushState({state : id}, "", `reply-${id}`);
        compose_email(email['id'])
      })
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
      .then(reloadpage())
      )
      document.querySelector("#see_email").append(unread);
    }
  })
}
