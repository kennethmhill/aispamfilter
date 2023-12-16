import { Email } from './email.js';

export class Filter {
    // settings 
    constructor(black_list = [], white_list = [], enable_ai = false, thresh = 0.75) {
        this.threshold = thresh;
        Object.assign(this, { black_list, white_list, enable_ai });
    }

    detect(inbox) {
        this.black_list = $('#blacklist').val().split(/[,\n]/)
            .map(e => e.trim().toLowerCase()).filter(e => e !== '');
        this.white_list = $('#whitelist').val().split(/[,\n]/)
            .map(e => e.trim().toLowerCase()).filter(e => e !== '');
        this.filter_lists(); // omit matching white_list/black_list terms

        // order: initial black_list -> heuristic filter -> white_list override
        if (this.black_list.length > 0) this.blacklist_filter(inbox);
        if (this.enable_ai) this.filter_emails(inbox);
        if (this.white_list.length > 0) this.whitelist_filter(inbox);

        console.log('spam.length:' + inbox.spam.length);
        console.log('emails.length:' + inbox.emails.length);
        console.log('spam:' + JSON.stringify(inbox.spam));
        console.log('emails:' + JSON.stringify(inbox.emails));
    }

    filter_lists() {
        var omit_terms = $.grep(this.white_list, (term) => {
            return $.inArray(term.toLowerCase(), this.black_list) !== -1;
        });

        if (omit_terms.length > 0) {
            $.notify("The following terms were found in both the whitelist and the blacklist, and will be omitted from the spam filter: " + omit_terms.join(', '),
                { className: "info", autoHideDelay: 20000 });
        }

        $.each(omit_terms, (index, term) => {
            var i1 = this.white_list.indexOf(term), i2 = this.black_list.indexOf(term);
            if (i1 !== -1) this.white_list.splice(i1, 1);
            if (i2 !== -1) this.black_list.splice(i2, 1);
        });
    }

    heuristics(inbox) {
        var count = 0;
        $(inbox.emails).each((i, e) => {
            if (e.is_spam) {
                Email.mark_spam(e, false, inbox);
                count++;
            }
        });
        if (!count) $.notify("Heuristic analysis filtered 0 results. Try adjusting the threshold.", { className: "warn", autoHideDelay: 3000 });
        else {
            $.notify(count + " conversation(s) filtered using heuristic analysis.", { className: "success", autoHideDelay: 3000 });
        }
    }

    filter_emails(inbox) {
        if (this.enable_ai) this.heuristics(inbox);
        if (this.black_list.length > 0) this.blacklist_filter(inbox);
        if (this.white_list.length > 0) this.whitelist_filter(inbox);
    }

    blacklist_filter(inbox) {
        var count = 0;
        if (this.black_list.length == 0 || this.black_list[0] == '') return;
    
        for (var i = 0; i < inbox.emails.length; i++) {
            var e = inbox.emails[i];
            if (e && e.sender && e.subject && e.content) {
                var is_spam = this.black_list.some((word) => {
                    return e.sender.toLowerCase().includes(word.trim().toLowerCase()) ||
                        e.subject.toLowerCase().includes(word.trim().toLowerCase()) ||
                        e.content.toLowerCase().includes(word.trim().toLowerCase());
                });
    
                if (is_spam) {
                    Email.mark_spam(e, false, inbox);
                    count++;
                }
            }
        }
    
        if (!count) $.notify("Nothing blacklisted. Try adjusting the settings.", { className: "warn", autoHideDelay: 3000 });
        else {
            $.notify(count + " conversation(s) added to spam.", { className: "success", autoHideDelay: 3000 });
            inbox.update_tabs(true);
            inbox.update_mark_all(inbox.current_tab, false);
        }
    }
    

    whitelist_filter(inbox) {
        var count = 0;
        if (this.white_list.length === 0 || this.white_list[0] === '') return;
    
        for (let i = 0; i < inbox.spam.length; i++) {
            const message = inbox.spam[i];
    
            // Ensure that message.sender, message.subject, and message.content are defined
            if (message.sender && message.subject && message.content) {
                console.log('checking: ' + message);
                const contains_whitelist = this.white_list.some((word) => {
                    return message.sender.toLowerCase().includes(word.trim().toLowerCase()) ||
                        message.subject.toLowerCase().includes(word.trim().toLowerCase()) ||
                        message.content.toLowerCase().includes(word.trim().toLowerCase());
                });
    
                if (contains_whitelist) {
                    Email.mark_not_spam(message, false, inbox);
                    count++;
                }
            }
        }
    
        if (!count) $.notify("Nothing whitelisted. Try adjusting the settings.", { className: "warn", autoHideDelay: 3000 });
        else {
            $.notify(count + " conversation(s) moved to inbox.", { className: "success", autoHideDelay: 3000 });
            inbox.update_tabs(true);
            inbox.update_mark_all(inbox.current_tab, false);
        }
    }
}