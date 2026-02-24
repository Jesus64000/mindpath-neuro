const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

exports.generateMedicalReport = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: "No se proporcionó texto para analizar." });
        }

        // Mock si no hay API KEY
        if (!groq) {
            console.log("GROQ_API_KEY no detectada. Usando respuesta simulada.");
            return setTimeout(() => {
                res.status(200).json({
                    report: {
                        motivo_sintomas:        "Simulación: Paciente refiere cefalea tensional de 2 semanas de evolución, con predominio vespertino.",
                        antecedentes:           "Simulación: Madre con migrañas. Hipertensión arterial controlada. Niega alergias medicamentosas.",
                        hallazgos:              "Simulación: Pupilas isocóricas y normorreactivas. Contractura cervical bilateral. TA 130/80 mmHg. Sin déficit motor.",
                        diagnostico:            "Simulación: Cefalea tensional episódica. Descartar migraña sin aura.",
                        tratamiento:            "Simulación: Ibuprofeno 400mg c/8h por 3 días. Relajante muscular nocturno. Restricción de pantallas.",
                        estudios_observaciones: "Simulación: TAC de cráneo simple en 15 días. Pausas activas y calor local cervical. Control en 1 semana."
                    }
                });
            }, 1500);
        }

        // Prompt con los 6 campos del esquema clínico
        const promptSystem = `Eres un neurólogo experto. Lee la transcripción de la consulta y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional ni bloques de código:
{
  "motivo_sintomas": "Resumen del motivo de la consulta y síntomas referidos por el paciente.",
  "antecedentes": "Antecedentes personales y patológicos relevantes mencionados.",
  "hallazgos": "Hallazgos en el examen físico o neurológico.",
  "diagnostico": "Diagnóstico presuntivo o confirmado deducido de la consulta.",
  "tratamiento": "Tratamiento médico, fármacos y dosis indicadas.",
  "estudios_observaciones": "Estudios complementarios solicitados y observaciones importantes."
}
Regla de oro: Si un campo no se menciona en la transcripción, escribe "No se refieren datos en la consulta." No inventes medicamentos ni síntomas.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: promptSystem },
                { role: "user",   content: `Transcripción de la consulta: "${text}"` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const reportJSON = JSON.parse(chatCompletion.choices[0]?.message?.content);
        res.status(200).json({ report: reportJSON });

    } catch (error) {
        console.error("Error en IA Controller:", error);
        res.status(500).json({ message: "Error al generar informe." });
    }
};
