export const VENEZUELAN_BANKS = [
    { code: '0102', name: 'Banco de Venezuela' },
    { code: '0105', name: 'Mercantil' },
    { code: '0108', name: 'Provincial' },
    { code: '0114', name: 'Bancaribe' },
    { code: '0115', name: 'Exterior' },
    { code: '0128', name: 'BFC Banco Fondo Común' },
    { code: '0134', name: 'Banesco' },
    { code: '0137', name: 'Sofitasa' },
    { code: '0138', name: 'Bancrecer' },
    { code: '0156', name: '100% Banco' },
    { code: '0157', name: 'DelSur' },
    { code: '0163', name: 'Banco del Tesoro' },
    { code: '0166', name: 'Banco Agrícola de Venezuela' },
    { code: '0168', name: 'Banplus' },
    { code: '0169', name: 'Mi Banco' },
    { code: '0172', name: 'Bancamiga' },
    { code: '0174', name: 'Banfanb' },
    { code: '0175', name: 'Banco Bicentenario' },
    { code: '0191', name: 'BNC Banco Nacional de Crédito' }
];

export const PAYMENT_METHOD_TEMPLATES = {
    'efectivo': {
        hint: 'Indica si se cobra exacto o con referencia interna',
        placeholder: 'Cobro en efectivo al finalizar la consulta.\nFavor traer monto exacto o cambio.',
    },
    'transferencia bancaria': {
        hint: 'Banco, titular, cuenta y cédula/RIF del titular',
        placeholder: 'Banco: Banesco\nTitular: Nombre Apellido\nCuenta: 0102-0000-00-0000000000\nCI/RIF: V-12345678\nTipo: Cuenta corriente',
    },
    'transferencia nacional': {
        hint: 'Banco, titular, cuenta y cédula/RIF del titular',
        placeholder: 'Banco: Banesco\nTitular: Nombre Apellido\nCuenta: 0102-0000-00-0000000000\nCI/RIF: V-12345678\nTipo: Cuenta corriente',
    },
    'transferencia internacional': {
        hint: 'Banco internacional, SWIFT/IBAN y correo',
        placeholder: 'Banco: Banco internacional\nTitular: Nombre Apellido\nSWIFT/IBAN: XXXXXXXX\nCorreo: nombre@correo.com',
    },
    transferencia: {
        hint: 'Banco, titular, cuenta y cédula/RIF del titular',
        placeholder: 'Banco: Banesco\nTitular: Nombre Apellido\nCuenta: 0102-0000-00-0000000000\nCI/RIF: V-12345678\nTipo: Cuenta corriente',
    },
    zelle: {
        hint: 'Correo asociado a Zelle y nombre del titular',
        placeholder: 'Correo Zelle: nombre@correo.com\nTitular: Nombre Apellido',
    },
    binance: {
        hint: 'Binance ID, correo o usuario de cobro',
        placeholder: 'Binance ID: 123456789\nCorreo: nombre@correo.com\nUsuario: @miusuario',
    },
    paypal: {
        hint: 'Correo asociado a PayPal o enlace (PayPal.me)',
        placeholder: 'Correo PayPal: nombre@correo.com\nEnlace: paypal.me/miusuario',
    },
    'pago movil': {
        hint: 'Banco, teléfono, cédula y RIF si aplica',
        placeholder: 'Banco: Banesco\nTeléfono: 0414-0000000\nCédula: V-12345678\nRIF: J-00000000-0',
    },
    'pago móvil': {
        hint: 'Banco, teléfono, cédula y RIF si aplica',
        placeholder: 'Banco: Banesco\nTeléfono: 0414-0000000\nCédula: V-12345678\nRIF: J-00000000-0',
    },
    'efectivo en consultorio': {
        hint: 'Indica si se cobra exacto o con referencia interna',
        placeholder: 'Cobro en efectivo al finalizar la consulta.\nFavor traer monto exacto o cambio.',
    },
    'pago por plataforma': {
        hint: 'Referencia o instrucciones de pago en la plataforma',
        placeholder: 'El pago se procesa directamente desde la plataforma.\nLa confirmación queda registrada automáticamente.',
    },
    otro: {
        hint: 'Escribe la instrucción o formato personalizado',
        placeholder: 'Especifica aquí los datos de cobro personalizados.',
    },
};

export const normalizePaymentKey = (value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const getPaymentTemplate = (catalogName = '', fallbackTemplate = '') => {
    const normalized = normalizePaymentKey(catalogName);
    return PAYMENT_METHOD_TEMPLATES[normalized] || (fallbackTemplate ? { hint: 'Formato sugerido desde catálogo', placeholder: fallbackTemplate } : null);
};

export const PAYMENT_FIELD_PRESETS = {
    'transferencia bancaria': { bank_name: '', account_holder: '', account_number: '', doc_type: 'V', id_number: '', account_type: '' },
    transferencia: { bank_name: '', account_holder: '', account_number: '', doc_type: 'V', id_number: '', account_type: '' },
    'transferencia nacional': { bank_name: '', account_holder: '', account_number: '', doc_type: 'V', id_number: '', account_type: '' },
    'transferencia internacional': { bank_name: '', account_holder: '', account_number: '', id_number: '', account_type: '', contact_email: '' },
    zelle: { zelle_email: '', account_holder: '' },
    binance: { binance_id: '', binance_email: '', binance_user: '' },
    paypal: { paypal_email: '', paypal_link: '' },
    'pago movil': { bank_name: '', phone_prefix: '0412', phone_body: '', doc_type: 'V', id_number: '' },
    'pago móvil': { bank_name: '', phone_prefix: '0412', phone_body: '', doc_type: 'V', id_number: '' },
    'efectivo en consultorio': { cash_note: 'Cobro en efectivo al finalizar la consulta.\nFavor traer monto exacto o cambio.' },
    efectivo: { cash_note: 'Cobro en efectivo al finalizar la consulta.\nFavor traer monto exacto o cambio.' },
    'pago por plataforma': { platform_note: 'El pago se procesa directamente desde la plataforma.\nLa confirmación queda registrada automáticamente.' },
    otro: { custom_details: '' },
};

export const getCatalogKey = (catalogName = '') => normalizePaymentKey(catalogName);

export const buildPaymentDetails = (catalogName, paymentFields) => {
    const key = getCatalogKey(catalogName);
    const lines = [];

    if (key === 'transferencia bancaria' || key === 'transferencia' || key === 'transferencia nacional') {
        if (paymentFields.bank_name) lines.push(`Banco: ${paymentFields.bank_name}`);
        if (paymentFields.account_holder) lines.push(`Titular: ${paymentFields.account_holder}`);
        if (paymentFields.account_number) lines.push(`Cuenta: ${paymentFields.account_number}`);
        if (paymentFields.id_number) lines.push(`CI/RIF: ${paymentFields.doc_type || 'V'}-${paymentFields.id_number}`);
        if (paymentFields.account_type) lines.push(`Tipo: ${paymentFields.account_type}`);
    } else if (key === 'transferencia internacional') {
        if (paymentFields.bank_name) lines.push(`Banco: ${paymentFields.bank_name}`);
        if (paymentFields.account_holder) lines.push(`Titular: ${paymentFields.account_holder}`);
        if (paymentFields.account_number) lines.push(`SWIFT/IBAN: ${paymentFields.account_number}`);
        if (paymentFields.id_number) lines.push(`Documento: ${paymentFields.id_number}`);
        if (paymentFields.contact_email) lines.push(`Correo: ${paymentFields.contact_email}`);
    } else if (key === 'zelle') {
        if (paymentFields.zelle_email) lines.push(`Correo Zelle: ${paymentFields.zelle_email}`);
        if (paymentFields.account_holder) lines.push(`Titular: ${paymentFields.account_holder}`);
    } else if (key === 'binance') {
        if (paymentFields.binance_id) lines.push(`Binance ID: ${paymentFields.binance_id}`);
        if (paymentFields.binance_email) lines.push(`Correo: ${paymentFields.binance_email}`);
        if (paymentFields.binance_user) lines.push(`Usuario: ${paymentFields.binance_user}`);
    } else if (key === 'paypal') {
        if (paymentFields.paypal_email) lines.push(`Correo PayPal: ${paymentFields.paypal_email}`);
        if (paymentFields.paypal_link) lines.push(`Enlace: ${paymentFields.paypal_link}`);
    } else if (key === 'pago movil' || key === 'pago móvil') {
        if (paymentFields.bank_name) lines.push(`Banco: ${paymentFields.bank_name}`);
        const phone = paymentFields.phone_number || (paymentFields.phone_prefix && paymentFields.phone_body ? `${paymentFields.phone_prefix}-${paymentFields.phone_body}` : '');
        if (phone) lines.push(`Teléfono: ${phone}`);
        const docVal = paymentFields.id_number ? `${paymentFields.doc_type || 'V'}-${paymentFields.id_number}` : '';
        if (docVal) lines.push(`Documento: ${docVal}`);
    } else if (key === 'otro') {
        if (paymentFields.custom_details) lines.push(paymentFields.custom_details);
    } else if (key === 'efectivo en consultorio' || key === 'efectivo') {
        lines.push(paymentFields.cash_note || PAYMENT_METHOD_TEMPLATES['efectivo'].placeholder);
    } else if (key === 'pago por plataforma') {
        lines.push(paymentFields.platform_note || PAYMENT_METHOD_TEMPLATES['pago por plataforma'].placeholder);
    }

    return lines.filter(Boolean).join('\n').trim();
};

export const createDefaultPaymentFields = (catalogName = '', fallbackTemplate = '') => {
    const key = getCatalogKey(catalogName);
    const preset = PAYMENT_FIELD_PRESETS[key] || {};
    if (Object.keys(preset).length > 0) return { ...preset };
    if (fallbackTemplate) return { custom_details: fallbackTemplate };
    return { custom_details: '' };
};

export const parsePaymentDetails = (catalogName = '', accountDetails = '') => {
    const key = getCatalogKey(catalogName);
    const result = createDefaultPaymentFields(catalogName);

    if (!accountDetails) return result;

    const lines = accountDetails.split('\n').map(l => l.trim());
    const data = {};
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const field = parts[0].trim().toLowerCase();
            const val = parts.slice(1).join(':').trim();
            data[field] = val;
        }
    });

    if (key === 'pago movil' || key === 'pago móvil') {
        result.bank_name = data['banco'] || '';
        const phone = data['telefono'] || '';
        if (phone) {
            const cleanPhone = phone.replace(/[-\s]/g, '');
            if (cleanPhone.length >= 4) {
                result.phone_prefix = cleanPhone.slice(0, 4);
                result.phone_body = cleanPhone.slice(4);
            } else {
                result.phone_prefix = '0412';
                result.phone_body = cleanPhone;
            }
        } else {
            result.phone_prefix = '0412';
            result.phone_body = '';
        }

        const doc = data['documento'] || data['cedula'] || data['rif'] || '';
        if (doc) {
            const docParts = doc.split('-');
            if (docParts.length >= 2) {
                result.doc_type = docParts[0].trim().toUpperCase();
                result.id_number = docParts.slice(1).join('-').trim();
            } else {
                const firstChar = doc.charAt(0).toUpperCase();
                if (['V', 'E', 'J', 'G', 'P', 'R'].includes(firstChar)) {
                    result.doc_type = firstChar;
                    result.id_number = doc.slice(1).replace(/[-\s]/g, '');
                } else {
                    result.doc_type = 'V';
                    result.id_number = doc.replace(/[-\s]/g, '');
                }
            }
        } else {
            result.doc_type = 'V';
            result.id_number = '';
        }
    } else if (key === 'transferencia bancaria' || key === 'transferencia' || key === 'transferencia nacional') {
        result.bank_name = data['banco'] || '';
        result.account_holder = data['titular'] || '';
        result.account_number = data['cuenta'] || '';
        result.account_type = data['tipo'] || '';
        const doc = data['ci/rif'] || data['documento'] || data['cedula'] || '';
        if (doc) {
            const docParts = doc.split('-');
            if (docParts.length >= 2) {
                result.doc_type = docParts[0].trim().toUpperCase();
                result.id_number = docParts.slice(1).join('-').trim();
            } else {
                result.doc_type = 'V';
                result.id_number = doc;
            }
        }
    } else if (key === 'transferencia internacional') {
        result.bank_name = data['banco'] || '';
        result.account_holder = data['titular'] || '';
        result.account_number = data['swift/iban'] || data['cuenta'] || '';
        result.id_number = data['documento'] || '';
        result.contact_email = data['correo'] || '';
    } else if (key === 'zelle') {
        result.zelle_email = data['correo zelle'] || data['correo'] || '';
        result.account_holder = data['titular'] || '';
    } else if (key === 'binance') {
        result.binance_id = data['binance id'] || data['id'] || '';
        result.binance_email = data['correo'] || '';
        result.binance_user = data['usuario'] || '';
    } else if (key === 'paypal') {
        result.paypal_email = data['correo paypal'] || data['correo'] || '';
        result.paypal_link = data['enlace'] || '';
    } else if (key === 'otro') {
        result.custom_details = accountDetails;
    }

    return result;
};
