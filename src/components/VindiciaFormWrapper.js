import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CryptoJS from 'crypto-js';

class VindiciaFormWrapper extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            sessionId: '',
            sessionHash: '',
            localOptions: this.constructOptions()
        };
    }

    componentDidMount() {
        const { vindicia } = this.props;
        const { localOptions } = this.state;

        this.updateHiddenFields();
        
        if (vindicia) {
            vindicia.setup(localOptions);
        }

        this.addFocusForProtectedFields();
    }

    componentWillUnmount() {
        const { vindicia } = this.props;
        vindicia.destroy();
    }

    updateHiddenFields() {
        const otl_hmac_key = "A39485F85039D394059B948390";
        const sessionId = `CC${Date.now}`;
        const sessionHash = CryptoJS.HmacSHA512(sessionId + "#POST#/payment_methods", otl_hmac_key);

        this.setState({ sessionId, sessionHash });
    }

    resetVindicia() {
        const { vindicia } = this.props;
        vindicia.clearData();
        vindicia.resetCompleteStatus();
        this.updateHiddenFields();
    }

    constructOptions() {
        const {
            options,
            fields,
            styles,
            onSubmitEvent,
            onSubmitCompleteEvent,
            onSubmitCompleteFailedEvent,
            onVindiciaFieldEvent } = this.props;

        const hostedFields = {};
        fields.forEach(item => {
            for (let i = 0; i < hostedFieldDefaults.length; i++) {
                if (item.type === hostedFieldDefaults[i].name) {
                    hostedFields[hostedFieldDefaults[i].name] = {
                        selector: item.selector || hostedFieldDefaults[i].selector,
                        placeholder: item.placeholder || hostedFieldDefaults[i].placeholder,
                        format: item.format || hostedFieldDefaults[i].format
                    };
                }
            }
        });

        hostedFields.styles = styles;

        const localOptions = {
            ...options,
            hostedFields,
            onSubmitEvent: onSubmitEvent,
            onSubmitCompleteEvent: onSubmitCompleteEvent,
            onSubmitCompleteFailedEvent: onSubmitCompleteFailedEvent,
            onVindiciaFieldEvent: onVindiciaFieldEvent
        };

        return localOptions;
    }

    addFocusForProtectedFields() { //TODO
        const { hostedFields, vindicia } = this.props;

        for (let field in hostedFields) {
            const selector = hostedFields[field].selector;
            const el = document.querySelectorAll(`[for="${selector.slice(1, selector.length)}"`);
            
            if (el && vindicia.frames[field].source) {
                el.onclick = vindicia.frames[field].source.focus();
            }
        }
    }

    parseStyles() {
        const { styles } = this.props;

        let styleOutput = '';

        Object.keys(styles).map(selector => {
            styleOutput += `${selector} {\n`;
            Object.keys(styles[selector]).map(rule => {
                styleOutput += `  ${rule}: ${styles[selector][rule]};\n`;
            });
            styleOutput += '}\n';
        });

        return styleOutput;
    }

    renderFields() {
        const { fields } = this.props;
        const { localOptions : { hostedFields } } = this.state;

        return hostedFields && fields.map(field => {

            let inputField = (
                <input
                    className="field-group__input"
                    type={field.type}
                    placeholder={field.placeholder}
                />
            );

            const validHostedFieldValues = hostedFieldDefaults.reduce((acc, curr) => acc.concat(curr.name), []);

            if (validHostedFieldValues.includes(field.type)) {
                let selector = hostedFields[field.type].selector;

                inputField = (
                    <div id={selector.substring(1, selector.length)} />
                );
            }

            return (
                <div className="field-group" key={`vin-field-${field.label || field.type || 'jsx'}`}>
                    {field.label &&
                        <label className="field-group__label">{field.label}</label>
                    }
                    {field.render || inputField}
                </div>
            );
        });
    }


    render () {
        const { sessionId, sessionHash } = this.state;
        const { options, children, vindicia, styles } = this.props;

        return (vindicia &&
            <form id={options.formId || 'mainForm'}>
                <style
                    type="text/css"
                    dangerouslySetInnerHTML={{__html: this.parseStyles(styles)}}
                />
                <input name="vin_session_id" value={sessionId} type="hidden" />
                <input name="vin_session_hash" value={sessionHash} type="hidden" />
                {this.renderFields()}
                <button type="submit" id="submitButton">Submit</button>
                {children}
            </form>
        );
    };
}

VindiciaFormWrapper.propTypes = {
    options: PropTypes.object,
    hostedFields: PropTypes.array,
    styles: PropTypes.object,
    vindicia: PropTypes.object,
    onSubmitEvent: PropTypes.func,
    onSubmitCompleteEvent: PropTypes.func,
    onSubmitCompleteFailedEvent: PropTypes.func,
    onVindiciaFieldEvent: PropTypes.func
};

const hostedFieldDefaults = [
    { name: 'name', selector: '#vin_account_holder' },
    { name: 'billing1', selector: '#vin_billing_address_line1' },
    { name: 'billing2', selector: '#vin_billing_address_line2' },
    { name: 'billing3', selector: '#vin_billing_address_line3' },
    { name: 'city', selector: '#vin_billing_city' },
    { name: 'district', selector: '#vin_billing_address_district' },
    { name: 'postalCode', selector: '#vin_billing_address_postal_code' },
    { name: 'country', selector: '#vin_billing_address_country' },
    { name: 'phone', selector: '#vin_billing_address_phone' },
    { name: 'cardNumber', selector: '#vin_credit_card_account' },
    { name: 'expirationDate', selector: '#vin_credit_card_expiration_date', format: 'MM/YY' },
    { name: 'expirationMonth', selector: '#vin_credit_card_expiration_month' },
    { name: 'expirationYear', selector: '#vin_credit_card_expiration_year' },
    { name: 'cvn', selector: '#vin_credit_card_cvn' }
];

export default VindiciaFormWrapper;
