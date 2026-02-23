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
            console.log("⚠️ GROQ_API_KEY no detectada. Usando respuesta simulada para el laboratorio.");
            setTimeout(() => {
                return res.status(200).json({
                    report: {
                        antecedentes: "Simulación: Paciente refiere dolores de cabeza frecuentes desde hace 3 semanas.",
                        hallazgos: "Simulación: Sin anomalías motoras aparentes. Tensión arterial elevada.",
                        plan: "Simulación: Ibuprofeno 400mg c/8h y resonancia magnética en 15 días."
                    }
                });
            }, 2000);
            return;
        }
        // Prompt real
        const promptSystem = `
        Eres un asistente médico experto en neurología. Lee la transcripción de la consulta y devuelve UNICAMENTE un objeto JSON válido con la siguiente estructura, sin texto adicional ni formato markdown (\`\`\`json):
        {
            "antecedentes": "Resumen del motivo de consulta y síntomas previos",
            "hallazgos": "Qué se detectó en la consulta (examen físico o síntomas actuales)",
            "plan": "Qué tratamiento o exámenes se indicaron"
        }
        `;
        // Actualiza el modelo a uno soportado por Groq
        // Consulta https://console.groq.com/docs/deprecations para modelos válidos
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: promptSystem },
                { role: "user", content: `Transcripción de la consulta: "${text}"` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });
        const reportRaw = chatCompletion.choices[0]?.message?.content;
        const reportJSON = JSON.parse(reportRaw);
        res.status(200).json({ report: reportJSON });
    } catch (error) {
        console.error("Error en IA Controller:", error);
        res.status(500).json({ message: "Error al generar informe." });
    }
};
