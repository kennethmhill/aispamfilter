import { Model } from './model.mjs';

export async function file_exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (e) {
        return false;
    }
}

export function fetch_results(csv = '../../csv/emails.csv') {
    return new Promise((resolve, reject) => {
        fetch(csv)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (result) => {
                        resolve(result.data);
                    },
                    error: (error) => {
                        reject(new Error(error.message));
                    },
                });
            })
            .catch(error => {
                reject(new Error(error.message));
            });
    });
}

export function interpolate_rgb(color1, color2, percentage) {
    return color1.map((channel1, index) => {
        const channel2 = color2[index];
        const inter_channel = Math.round(channel1 + percentage * (channel2 - channel1));
        return Math.min(255, Math.max(0, inter_channel)); // Ensure the value is in the valid RGB range
    });
}

export function darken(rgb, factor) {
    if (Array.isArray(rgb)) {
        return `rgb(${rgb.map(component => Math.round(component * factor)).join(', ')})`;
    } else {
        return rgb; // return original if not an array
    }
}

export function update_threshold(m, t){
    m.each((i,e) => {
        console.log(e);
        var c = this.get_email_colors(e.spam_prob, t);
        $('[data-email-id="'+e.id+'"]').find('.spam_prob').css({ background: c[0], border: `1px solid ${c[1]}`});
    });
}

export function get_email_colors(p, t) {
    console.log('p:'+p+',t:'+t);
    var green = [162, 193, 28],
        yellow = [255, 234, 0],
        red = [255, 0, 0],
        tooltip = '',
        color = '';

    console.log('thresh:'+t);

    if (p < t) {
        color = interpolate_rgb(green, yellow, p / t);
        tooltip = '<div class="tooltip"><span class="tooltiptext">There is a low likelihood this email is spam.</span></div>';
    } else {
        color = interpolate_rgb(yellow, red, (p - t) / (1 - t));
        tooltip = '<div class="tooltip"><i class="fa fa-info-circle"></i><span class="tooltiptext">There is a ' + (p * 100).toFixed(2) + '% chance this email is spam. Proceed with caution.</span></div>';
    }

    var color1 = `rgb(${color.join(', ')})`, color2 = darken(color1, .7);
    return [color1, color2];
}


export function first20(text) {
    return text.split(/\s+/).slice(0, 20).join(' '); // return first 20 words
}

export function get_trimmed_content(content){
    return $('<div>').html(DOMPurify.sanitize(content)).text().substring(0, 500); // strip html, sanitize
}

export function generate_timestamp(time){
    var date = moment(time, "ddd, DD MMM YYYY HH:mm:ss Z"), today = moment().startOf('day'), timestamp = '';
    if (date.isSame(today, 'day')) return date.format('HH:mm');
    else return date.format('MMM D YYYY');
}