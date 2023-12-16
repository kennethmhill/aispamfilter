import * as Filter from './filter.js';
import { get_email_colors } from './util.js';
import * as Inbox from './inbox.js';

let email_id = 0, threshold = .75;

export class Email {
    constructor(sender = '', subject = '', content = '', timestamp = '', type = 'email', prob = 0.0, thresh = threshold) {
        this.id = this.index = email_id++;
        Object.assign(this, { sender, subject, content, timestamp, type, spam_prob: prob, is_spam: prob > thresh });
        threshold = thresh;
    }

    to_html() {
        var tooltip = '';
        var p = this.spam_prob * 100, colors = get_email_colors(this.spam_prob, threshold);
        var html = '<div class="' + (this.is_spam ? 'spam' : 'email') + '" data-email-id="' + this.id + '" data-email-index="'+ this.index + '" data-spam-prob="'+this.spam_prob+'">';
        html += '<button class="mark-spam"><i class="fa fa-times-circle"></i>Mark Spam</button>';
        html += '<button class="mark-not-spam"><i class="fa fa-check-circle"></i>Not Spam</button>';
        html += '<div class="spam_prob hidden" style="background:'+colors[0]+'; border:1px solid '+colors[1]+';" data-value="'+Math.ceil(p)+'"><i class="fa fa-ban"></i>'+ p.toFixed(2) +'%'+tooltip+'</div>';
        html += '<div class="check"><input class="marked" id="cbx-'+this.index+'" type="checkbox" style="display: none;"/><label class="cbx" for="cbx-'+this.index+'"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label></div>';
        html += '<div class="sender">' + this.sender + '</div>';
        html += '<div class="subject">'+ this.subject + '</div>';
        html += '<div class="excerpt">' + this.content + '</div>';
        html += '<div class="timestamp">' + this.timestamp + '</div>';
        html += '</div>';
        return html;
    }

    static mark(id, e, inbox) {
        if (!$(e.target).is('button')) {
            $($('[data-email-id="' + id + '"] .marked')).prop('checked', !$($('[data-email-id="' + id + '"] .marked')).prop("checked"));
            Email.update_selected(inbox);
            inbox.update_mark_all(inbox.current_tab, false);
        }
    }

    static mark_spam(e, notify, inbox) {
        var message = inbox.emails.splice(e.index, 1)[0]; 
        message.type = 'spam';
        inbox.spam.push(message); 
        this.update_inbox(inbox, false);
        this.move(message);

        if (inbox.emails.length === 0) $('#emails .message').text('Inbox is empty.').show();
        else if ($('.email:visible').length === 0) $('#emails .message').text('Nothing found.').show();
        if (inbox.spam.length === 1) $('#spam .message').hide();
        if (notify) $.notify("Conversation marked as spam.", { className: "success", autoHideDelay: 9000 });
    }

    static mark_not_spam(e, notify, inbox) {
        var message = inbox.spam.splice(e.index, 1)[0]; 
        message.type = 'email';
        inbox.emails.push(message);
        this.update_inbox(inbox, false)
        this.move(message);

        if (inbox.spam.length === 0) $('#spam .message').text('Spam folder is empty. Try running the spam filter.').show();
        else if ($('.spam:visible').length === 0) $('#spam .message').text('Nothing found.').show();
        if (inbox.spam.length === 1) $('#emails .message').hide();
        if (notify) $.notify("Conversation moved back to inbox.", { className: "success", autoHideDelay: 9000 });
    
    }
    

    static mark_all_spam(inbox) {
        var selection = $('.email .check .marked:checked');
        selection.each((index, element) => {
            var emailIndex = $(element).closest('.email').data('email-index');
            var email = inbox.emails[emailIndex];
            Email.mark_spam(email, false, inbox);
        });
        $.notify(selection.length + " conversations moved to spam folder.", { className: "success", autoHideDelay: 3000 });
    }
    
    static mark_all_not_spam(inbox) {
        var selection = $('.spam .check .marked:checked');
        selection.each((index, element) => {
            var emailIndex = $(element).closest('.spam').data('email-index');
            var email = inbox.spam[emailIndex];
            Email.mark_not_spam(email, false, inbox);
        });
        $.notify(selection.length + " conversations moved back to inbox.", { className: "success", autoHideDelay: 3000 });
    }

    static move(e){
        var $message = $('[data-email-id="'+e.id+'"]').detach();
        $($message).toggleClass('email spam');
        $($message).find('.marked').prop('checked', false);

        if(e.type == 'spam') $('#spam').append($message);
        else $('#emails').prepend($message);
    }
    
    static update_inbox(inbox, open){
        Email.update_indices(inbox);
        Email.update_selected(inbox);
        inbox.update_mark_all(inbox.current_tab, open);
        inbox.update_tabs(open);
    }

    static update_indices(inbox) {
        $.each(inbox.emails, (i, e) => Email.update_index(e, i));
        $.each(inbox.spam, (i, e) => Email.update_index(e, i));
    }
    
    static update_index(e, i) {
        const selector = '[data-email-id="' + e.id + '"]';
        $(selector).attr('data-email-index', i);
        e.index = i;
    }
    
    static update_selected(inbox) {    
        inbox.emails_selected = $('.email .check .marked:checked').length;
        inbox.spam_selected = $('.spam .check .marked:checked').length;
    }
    
}