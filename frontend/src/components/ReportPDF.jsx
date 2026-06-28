import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
    Image,
} from '@react-pdf/renderer';
import useSettingsStore from '../store/useSettingsStore';
import { BACKEND_URL } from '../api/constants';

// ── Estilos del PDF ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
        fontSize: 10,
        color: '#1a1a2e',
    },
    header: {
        borderBottom: '2pt solid #7c3aed',
        paddingBottom: 12,
        marginBottom: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#7c3aed' },
    brandSub:  { fontSize: 8,  color: '#6b7280', marginTop: 2 },
    metaBlock: { textAlign: 'right' },
    metaRow:   { fontSize: 9, color: '#6b7280', marginBottom: 2 },
    title: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 18,
        borderBottom: '1pt solid #f3f4f6',
        paddingBottom: 8,
    },
    section: {
        marginBottom: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#7c3aed',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    sectionText: {
        fontSize: 10,
        color: '#374151',
        lineHeight: 1.5,
    },
    sectionTextBold: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        lineHeight: 1.5,
    },
    privateBox: {
        backgroundColor: '#1e1b4b',
        borderRadius: 6,
        padding: 10,
        marginBottom: 12,
    },
    privateTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#c4b5fd',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    privateText: { fontSize: 10, color: '#e5e7eb', fontStyle: 'italic' },
    paymentBox: {
        marginBottom: 12,
        padding: 10,
        borderRadius: 6,
        backgroundColor: '#eff6ff',
        border: '1pt solid #dbeafe',
    },
    paymentTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1d4ed8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    paymentText: { fontSize: 10, color: '#1f2937', lineHeight: 1.5 },
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 40,
        right: 40,
        borderTop: '1pt solid #e5e7eb',
        paddingTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: { fontSize: 8, color: '#9ca3af' },
});

// ── Documento PDF ──────────────────────────────────────────────────────────
export const ReportPDFDocument = ({ report, header }) => {
    const { logoUrl } = useSettingsStore.getState();
    const resolvedLogo = logoUrl
        ? (logoUrl.startsWith('http') ? logoUrl : `${BACKEND_URL}${logoUrl}`)
        : '/logo.png';

    const formatTimeAMPM = (timeStr) => {
        if (!timeStr) return '';
        const [hourStr, minute] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };

    const timeStr = header?.start_time ? ` a las ${formatTimeAMPM(header.start_time)}` : '';
    const fecha = header?.appointment_date
        ? new Date(header.appointment_date.split('T')[0] + 'T12:00:00').toLocaleDateString('es-ES', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          }) + timeStr
        : '';

    return (
        <Document title={`Informe Clínico — ${header?.patient_name || ''}`}>
            <Page size="A4" style={styles.page}>

                {/* Membrete con logo */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image src={resolvedLogo} style={{ width: 40, height: 40, marginRight: 10 }} />
                        <View>
                            <Text style={styles.brandName}>MindPath Neuro</Text>
                            <Text style={styles.brandSub}>Centro de Salud Mental y Neurológica</Text>
                        </View>
                    </View>
                    <View style={styles.metaBlock}>
                        {header?.doctor_name  && <Text style={styles.metaRow}>Dr(a). {header.doctor_name}</Text>}
                        {header?.specialty    && <Text style={styles.metaRow}>{header.specialty}</Text>}
                        {header?.clinic_name  && <Text style={styles.metaRow}>{header.clinic_name}</Text>}
                        {header?.clinic_address && <Text style={styles.metaRow}>{header.clinic_address}</Text>}
                        {header?.rif          && <Text style={styles.metaRow}>RIF: {header.rif}</Text>}
                        {fecha                && <Text style={styles.metaRow}>{fecha}</Text>}
                    </View>
                </View>

                {/* Paciente */}
                <Text style={styles.title}>Historia Clínica</Text>
                <Text style={styles.subtitle}>
                    Paciente: {header?.patient_name || '—'}
                    {'   •   '}
                    Modalidad: {header?.type === 'virtual' ? 'Telemedicina' : 'Presencial'}
                </Text>

                {header?.legal_verification_code && (
                    <View style={styles.paymentBox}>
                        <Text style={styles.paymentTitle}>Código de verificación legal</Text>
                        <Text style={styles.paymentText}>Código legal: {header.legal_verification_code}</Text>
                    </View>
                )}

                {/* Motivo y síntomas */}
                {report.motivo_sintomas && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Motivo y Síntomas</Text>
                        <Text style={styles.sectionText}>{report.motivo_sintomas}</Text>
                    </View>
                )}

                {/* Antecedentes */}
                {report.antecedentes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Antecedentes</Text>
                        <Text style={styles.sectionText}>{report.antecedentes}</Text>
                    </View>
                )}

                {/* Hallazgos neurológicos */}
                {report.hallazgos && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hallazgos Neurológicos</Text>
                        <Text style={styles.sectionText}>{report.hallazgos}</Text>
                    </View>
                )}

                {/* Diagnóstico */}
                {report.diagnostico && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Diagnóstico</Text>
                        <Text style={styles.sectionTextBold}>{report.diagnostico}</Text>
                    </View>
                )}

                {/* Tratamiento */}
                {report.tratamiento && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tratamiento</Text>
                        <Text style={styles.sectionText}>{report.tratamiento}</Text>
                    </View>
                )}

                {/* Estudios */}
                {report.estudios_observaciones && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Estudios y Observaciones</Text>
                        <Text style={styles.sectionText}>{report.estudios_observaciones}</Text>
                    </View>
                )}

                {/* Notas privadas */}
                {report.private_notes && (
                    <View style={styles.privateBox}>
                        <Text style={styles.privateTitle}>🔒 Notas Privadas</Text>
                        <Text style={styles.privateText}>{report.private_notes}</Text>
                    </View>
                )}

                {/* Firma Digital del Doctor */}
                {header?.signature_picture && (
                    <View style={{ marginTop: 25, alignItems: 'center', justifyContent: 'center' }}>
                        <Image 
                            src={
                                header.signature_picture.startsWith('http') || header.signature_picture.startsWith('data:')
                                    ? header.signature_picture
                                    : `${BACKEND_URL}${header.signature_picture.startsWith('/') ? '' : '/'}${header.signature_picture}`
                            } 
                            style={{ width: 140, height: 60, objectFit: 'contain' }} 
                        />
                        <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', width: 180, marginTop: 4, paddingTop: 4, alignItems: 'center' }}>
                            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111827' }}>Dr(a). {header.doctor_name || 'Especialista'}</Text>
                            <Text style={{ fontSize: 7, color: '#6b7280', marginTop: 1 }}>Firma Digitalizada</Text>
                        </View>
                    </View>
                )}

                {/* Pie de página */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>MindPath Neuro — Documento confidencial</Text>
                    <Text style={styles.footerText}
                        render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};

// ── Botón de descarga reutilizable ─────────────────────────────────────────
export const PDFExportButton = ({ report, header, className = '' }) => {
    const filename = `informe_${(header?.patient_name || 'paciente').replace(/\s+/g, '_')}_${header?.appointment_date || Date.now()}.pdf`;

    return (
        <PDFDownloadLink
            document={<ReportPDFDocument report={report} header={header} />}
            fileName={filename}
        >
            {({ loading }) => (
                <button
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 bg-mindpath-primary hover:bg-mindpath-primary disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors ${className}`}
                >
                    {loading ? (
                        <><span className="animate-spin">⏳</span> Generando…</>
                    ) : (
                        <><span>📄</span> Descargar PDF</>
                    )}
                </button>
            )}
        </PDFDownloadLink>
    );
};
