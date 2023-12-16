import * as Util from './modules/util.js';
import * as Email from './modules/email.js';
import * as Inbox from './modules/inbox.js';
import * as Model from './modules/model.mjs';
import * as Filter from './modules/filter.js';

const app = {
    inbox: undefined,
    filter: undefined,
    model: undefined,
    settings: { enc_size: 20, threshold: 0.75, model_json: '../../model/model.json' }
};

const initializeApp = async () => {
    try {
        await Promise.all([ fadeInElement('#loading', 1000), fadeInElement('#sidebar', 1000) ]);

        // init app object
        app.inbox = new Inbox.Inbox();
        app.filter = new Filter.Filter();
        app.model = new Model.Model(app.settings.enc_size, app.settings.threshold, app.settings.model_json);

        // load model, fetch results, update ui
        const model = await loadModel();
        const results = await Util.fetch_results();
        await app.inbox.process_emails(app.model, app.settings.threshold, results);
        await app.inbox.fill_inbox();
        await app.inbox.update_tabs(true);
        loadUI();
    } catch (error) { console.error('Error during app initialization:', error); }
};

const loadModel = () => {
    return app.model.load_model().then(result => { return Util.fetch_results(); });
};

const fadeInElement = (selector, duration) => {
    return new Promise((resolve) => { $(selector).fadeIn(duration, resolve);});
};

const loadUI = () => {

    $("#detect").click(e => app.filter.detect(app.inbox)); // detect filter 
    $('#s').on('input', function () { app.inbox.search($(this).val().toLowerCase());}); // autofilter emails on search
    $('#s').on("focus", function(){ $(this).parent().toggleClass('active');}); // search focus
    
    // init tabs
    $( "#tabs" ).tabs({ active: 0, activate: function (e, ui) { app.inbox.open_tab($("#tabs").tabs("option", "active"));} });
    
    $('#heuristics').change(function() { // heuristics on switch 
        app.filter.enable_ai = $(this).prop('checked');
        $('.spam_prob').toggleClass('hidden');
        $('.spam_prob').each(function () { $(this).prop('Counter', 0).animate({ Counter: $(this).attr('data-value')}, { duration: 1000, easing: 'swing', step: function (now) { $(this).text(Math.ceil(now) + '%');} });});
    });

    $.fn.highlight = function(term) { // search highlight
        return this.each(function() {
            var $element = $(this);
            var content = $element.html() || '';

            if(typeof term === 'undefined') content = content.replace(/<mark>(.*?)<\/mark>/g, "$1");
            else{ //term >= 3 chars
                term = term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // Escape special characters in the term
                content = content.replace(/<mark>(.*?)<\/mark>/g, "$1"); // remove highlight
                var pattern = new RegExp("(" + term + ")", "gi");
                content = content.replace(pattern, "<mark>$1</mark>"); // apply highlight
            }
            $element.html(content); // replace content
        });
    };

    // threshold slider
    $('#threshold').on('change', function() { 
        app.settings.threshold = this.value; 
        app.filter.threshold = this.value;
        var $messages = $.merge($(app.inbox.emails), $(app.inbox.spam));
        Util.update_threshold($messages, this.value);
    });
};

// DOM Ready
$(initializeApp);