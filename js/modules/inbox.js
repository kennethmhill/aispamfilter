import { Model } from './model.mjs';
import { Email } from './email.js';
import { get_trimmed_content, generate_timestamp } from './util.js';

export class Inbox {

    constructor() {
        Object.assign(this, { current_tab: 0, emails_selected: 0, spam_selected: 0,
                emails: [], spam: [], search_term: ''});
        $( "#tabs" ).tabs({ active: 0, activate: function (e, ui) { Inbox.open_tab($("#tabs").tabs("option", "active"));} });
    }

    open_tab(t) {
        this.current_tab = t;
        this.update_mark_all(t, true);
    }

    async process_emails(model, threshold, results) {
        for (const element of results) {
            try {
                const spam_prob = await model.predict(element['Subject']);
                this.emails.push(new Email( element['Sender'], element['Subject'], get_trimmed_content(element['Content']),
                    generate_timestamp(element['Date']), "email", spam_prob, threshold ));
            } catch (error) {
                throw Error('Error processing emails:' + error.message);
            }
        }
    }
    
    async fill_inbox() {
        const email_container = $('#emails'), spam_container = $('#spam'), content = $("#content");
    
        await Promise.all(this.emails.map(async e => {
            try { email_container.append(e.to_html()); } 
            catch (error) { throw Error('Error processing email:', error);}
        }));
    
        // event delegation (must be added dynamically in modules)
        email_container.on('click', '.mark-spam', (e) => { Email.mark_spam(this.emails[$(e.currentTarget).closest('.email').attr('data-email-index')], true, this);});
        spam_container.on('click', '.mark-not-spam', (e) => { Email.mark_not_spam(this.spam[$(e.currentTarget).closest('.spam').attr('data-email-index')], true, this);});
        content.on('click', '#mark-all-spam', (e) => { Email.mark_all_spam(this);});
        content.on('click', '#mark-all-not-spam', (e) => { Email.mark_all_not_spam(this);});
        content.on('click', '.email', (e) => { Email.mark($(e.currentTarget).closest('.email').attr('data-email-id'), e, this);});
        content.on('click', '.spam', (e) => { Email.mark($(e.currentTarget).closest('.spam').attr('data-email-id'), e, this);});
        content.on('click', '.check', (e) => { $(this).find('.marked').click(); });
    
        email_container.fadeIn(1000);
        $('#emails .message').hide();
    }

    update_mark_all(i, open) {
        const mark_all_spam = $('#mark-all-spam'), mark_all_not_spam = $('#mark-all-not-spam');
        if (i === 0){ // tab opened
            if (open) { mark_all_not_spam.hide(); } 
            if (this.emails_selected > 0) mark_all_spam.fadeIn(300).html(`<i class="fa fa-times-circle"></i>Mark Spam (${this.emails_selected})`);
            else mark_all_spam.fadeOut(300);
        }else if (i === 1) { // spam folder
            if (open) mark_all_spam.hide(); // tab opened
            if (this.spam_selected > 0) mark_all_not_spam.fadeIn(300).html(`<i class="fa fa-check-circle"></i>Mark Not Spam (${this.spam_selected})`);
            else mark_all_not_spam.fadeOut(300);
        }
    }

    update_tabs(animate) {
        $('#inbox-tab').html(`<i class="fa fa-envelope"></i>Inbox <span class="notifications" data-value="${this.emails.length}">${this.emails.length}</span>`);
        $('#spam-tab').html(`<i class="fa fa-flag"></i>Spam <span class="notifications" data-value="${this.spam.length}">${this.spam.length}</span>`);
        $("#loading").hide();
        if (animate) $('.notifications').each(function () { $(this).prop('Counter', 0).animate({ Counter: $(this).text()}, { duration: 1000, easing: 'swing', step: function (now) { $(this).text(Math.ceil(now)); }});});
    }

    search(term) {
        $('#emails .email').stop().hide();
        $('#spam .spam').stop().hide();
        if (term.length >= 3) {
            if(this.current_tab == 0){
                $('#emails .email').filter(function() { return $(this).text().toLowerCase().includes(term);}).highlight(term).stop().show();
                if($('.email:visible').length == 0) $('#emails .message').text('Nothing found.').show();
                else $('#emails .message').hide();
            }else if(this.current_tab == 1){
                $('#spam .spam').filter(function() { return $(this).text().toLowerCase().includes(term);}).highlight(this.term).stop().show();
                if($('.spam:visible').length == 0) $('#spam .message').text('Nothing found.').show();
                else $('#spam .message').hide();    
            }
        } else {
            // If the search term is less than three characters, remove highlighting
            $('#emails .email').highlight().stop().fadeIn(400);
            $('#spam .spam').highlight().stop().fadeIn(400);
            if(this.current_tab == 0){
                if(this.emails.length == 0) $('#emails .message').text('Inbox is empty.');
                else $('#emails .message').hide();
            }else if(this.current_tab == 1){
                if(this.spam.length == 0) $('#spam .message').text('Spam folder is empty. Try running the spam filter.');
                else $('#spam .message').hide();
            }
        }
    }
}