// patient-manager.js
class DiagnosticManager {
    constructor() {
        this.apiEndpoint='https://physiocare-api.b00135522.workers.dev/'; // On peut renommer l’endpoint s’il est custom pour BabyCare si besoin
    }
    async analyze(data) {
        const response=await fetch(this.apiEndpoint,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({action:'analysis',data})
        });
        if(!response.ok) {
            const text=await response.text();
            throw new Error(`Erreur API analyse: ${response.status} - ${text}`);
        }
        return await response.json();
    }
}

class TreatmentManager {
    constructor() {
        this.apiEndpoint='https://physiocare-api.b00135522.workers.dev/'; // idem, éventuellement changer si un endpoint babycare est disponible
    }
    async getTreatment(data) {
        const response=await fetch(this.apiEndpoint,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({action:'treatment',data})
        });
        if(!response.ok) {
            const text=await response.text();
            throw new Error(`Erreur API traitement: ${response.status} - ${text}`);
        }
        return await response.json();
    }
}

class PatientManager {
    constructor() {
        this.currentPatientId=null;
        this.loadCurrentPatientId();
    }
    loadCurrentPatientId() {
        const pid=localStorage.getItem('currentPatientId');
        if(pid)this.currentPatientId=pid;
    }
    setCurrentPatientId(patientId) {
        this.currentPatientId=patientId;
        localStorage.setItem('currentPatientId',patientId);
    }
    loadPatientData() {
        if(!this.currentPatientId)return {};
        const data=localStorage.getItem(this.currentPatientId);
        return data?JSON.parse(data):{};
    }
    savePatientData(newData) {
        if(!this.currentPatientId) {
            const newId=`patient_${Date.now()}`;
            this.setCurrentPatientId(newId);
        }
        localStorage.setItem(this.currentPatientId,JSON.stringify(newData));
    }

    listPatients() {
        const keys=Object.keys(localStorage).filter(k=>k.startsWith('patient_'));
        return keys.map(k=>{
            const data=JSON.parse(localStorage.getItem(k));
            return {
                id:k,
                personalInfo:data.personalInfo||{}
            };
        });
    }

    async createNewPatient(personalInfo) {
        const newId=`patient_${Date.now()}`;
        this.setCurrentPatientId(newId);
        const newData={
            personalInfo:personalInfo||{},
            // On pourra ajuster les clés pour un parcours PMA, mais la structure reste la même
            // Le contenu des écrans HTML changera ce qu’on stocke dans ces objets.
            physicalActivity:{},
            symptoms:{},
            documents:[],
            remarks:'',
            diagnosisRemarks:'',
            diagnosis:[],
            treatment:{}
        };
        this.savePatientData(newData);

        await window.PatientStorageManager.saveDocuments([]);

        return newId;
    }

    deletePatient(patientId) {
        localStorage.removeItem(patientId);
        if(this.currentPatientId===patientId) {
            localStorage.removeItem('currentPatientId');
            this.currentPatientId=null;
        }
    }
}

// Fonctions inchangées, juste pas de mention d’étiopathie
async function pdfToText(base64data) {
    return "Exemple de texte extrait du PDF (OCR à implémenter).";
}

async function gatherPatientData() {
    const pManager=window.patientManager;
    const patientData=pManager.loadPatientData();
    const documents=await window.PatientStorageManager.loadDocuments();
    const formattedDocs=[];
    for(const doc of documents) {
        if(doc.type.startsWith('image/')) {
            formattedDocs.push({
                id:doc.id,
                name:doc.name,
                type:doc.type,
                size:doc.size,
                fileDataBase64:doc.fileData
            });
        } else if(doc.type==='application/pdf') {
            const textExtract=await pdfToText(doc.fileData);
            formattedDocs.push({
                id:doc.id,
                name:doc.name,
                type:doc.type,
                size:doc.size,
                textExtract
            });
        }
    }

    return {
        personalInfo: patientData.personalInfo||{},
        physicalActivity: patientData.physicalActivity||{},
        symptoms: patientData.symptoms||{},
        documentsRemarks: patientData.remarks||'',
        diagnosisRemarks: patientData.diagnosisRemarks||'',
        documents: formattedDocs,
        diagnosis: patientData.diagnosis||[]
    };
}

function updateDiagnosisData(diagnosisResult) {
    const pManager=window.patientManager;
    const data=pManager.loadPatientData();
    data.diagnosis=diagnosisResult.diagnostics||[];
    pManager.savePatientData(data);
}

function updateTreatmentData(treatmentResult) {
    const pManager=window.patientManager;
    const data=pManager.loadPatientData();
    data.treatment=treatmentResult.treatmentPlan||{};
    pManager.savePatientData(data);
}

class DocumentManager {
    // Inchangé, juste pas de mention d’étiopathie
    constructor() {
        this.storage = window.PatientStorageManager;
        this.initializeElements();
        this.setupEventListeners();
        this.loadSavedDocuments();
    }
    ...
}

window.DiagnosticManager=DiagnosticManager;
window.TreatmentManager=TreatmentManager;
window.PatientManager=PatientManager;
window.gatherPatientData=gatherPatientData;
window.updateDiagnosisData=updateDiagnosisData;
window.updateTreatmentData=updateTreatmentData;
window.DocumentManager=DocumentManager;

