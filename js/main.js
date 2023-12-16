import * as Util from './modules/util.js';
import * as Email from './modules/email.js';
import * as Inbox from './modules/inbox.js';
import * as Model from './modules/model.mjs';
import * as Filter from './modules/filter.js';

// App default objects
const app = {
    inbox: undefined,
    filter: undefined,
    model: undefined,
    settings: { enc_size: 20, threshold: 0.75, model_json: '../../model/model.json' }
};

const initializeApp = async () => {
    try {
        // Fade in loading and sidebar
        await Promise.all([ fadeInElement('#loading', 1000), fadeInElement('#sidebar', 1000) ]);

        // Initialize app objects
        app.inbox = new Inbox.Inbox();
        app.filter = new Filter.Filter();
        app.model = new Model.Model(app.settings.enc_size, app.settings.threshold, app.settings.model_json);

        // Load model, fetch results, and update UI
        const model = await loadModel();
        console.log('Model loaded:', model);

        const results = await Util.fetch_results();
        console.log('Results fetched:', results);

        await app.inbox.process_emails(app.model, app.settings.threshold, results);
        console.log('Processing emails completed.');

        await app.inbox.fill_inbox();
        console.log('Filling inbox completed.');

        await app.inbox.update_tabs(true);

        // Initialize UI
        loadUI();
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
};

const loadModel = () => {
    console.log('Loading AI model...');
    return app.model.load_model()
        .then(result => {
            console.log('AI model loaded successfully:', result);
            return Util.fetch_results();
        });
};

const fadeInElement = (selector, duration) => {
    return new Promise((resolve) => {
        $(selector).fadeIn(duration, resolve);
    });
};

const loadUI = () => {
    $( "#tabs" ).tabs({ active: 0, activate: function (e, ui) { app.inbox.open_tab($("#tabs").tabs("option", "active"));} });
    $("#detect").click(e => app.filter.detect(app.inbox));
     // autofilter emails on search
    $('#s').on('input', function () {
        app.inbox.search($(this).val().toLowerCase()); // Call the renamed method
    });
    // search focus
    $('#s').on("focus", function(){
        $(this).parent().toggleClass('active');
    });
    // heuristics on switch 
    $('#heuristics').change(function() {
        app.filter.enable_ai = $(this).prop('checked');
        $('.spam_prob').toggleClass('hidden');
        $('.spam_prob').each(function () {
          $(this).prop('Counter', 0).animate({ Counter: $(this).attr('data-value')}, {
              duration: 1000, easing: 'swing',
              step: function (now) { $(this).text(Math.ceil(now) + '%');}
          });
        });
    });

    $.fn.highlight = function(term) {
        return this.each(function() {
            var $element = $(this);
            var content = $element.html() || '';
            // term < 3 chars, remove highlight
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

    $('#threshold').on('change', function() { 
        app.settings.threshold = this.value; 
        app.filter.threshold = this.value;
        var $messages = $.merge($(app.inbox.emails), $(app.inbox.spam));
        Util.update_threshold($messages, this.value);
    });
    
    
    $( "#tabs" ).tabs({ active: 0, activate: function (e, ui) { app.inbox.open_tab($("#tabs").tabs("option", "active"));} });
};

// DOM Ready
$(initializeApp);