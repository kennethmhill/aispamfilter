import * as DICTIONARY from '../../model/dictionary.js';
import { first20 } from './util.js';

export class Model {

    constructor(enc_size, thresh, model_json) {
        Object.assign(this, { enc_size, thresh, model_json, model: undefined });
    }

    async load_model() {
        try {
            if (!this.model) {
                this.model = await tf.loadLayersModel(this.model_json);
            }
            return Promise.resolve(this.model);
        } catch (error) {
            return Promise.reject(new Error('Failed to load the model. Error: ' + error.message));
        }
    }

    // words -> tokens -> tensor
    tokenize(text) {
        const words = text.split(' '); // Split the text into an array of words
        const tokens = [DICTIONARY.START, ...words.map(word => DICTIONARY.LOOKUP[word] === undefined ? DICTIONARY.UNKNOWN : DICTIONARY.LOOKUP[word])];
        const paddedTokens = tokens.concat(Array(this.enc_size - tokens.length).fill(DICTIONARY.PAD));
        return tf.tensor2d([paddedTokens], [1, this.enc_size]); // Provide the shape [1, this.enc_size]
    }

    async predict(message) {
        try {    
            if (message === undefined || message === null) {
                console.warn('Received an undefined or null message. Skipping prediction.');
                return null; // or handle it in a way that fits your application logic
            }
    
            const text = first20(message.toLowerCase().replace(/[^\w\s]/g, ' '));    
            const tensor = this.tokenize(text);
            const results = await this.model.predict(tensor);
            const data = await results.data();
            return data[1];
        } catch (error) {
            throw new Error('Failed to predict spam probability1. Error: ' + error.message);
        }
    }
    
    
       

    is_spam(prob) {
        return prob > this.threshold;
    }
}