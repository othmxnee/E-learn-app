const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/userModel');
const Class = require('./models/classModel');
const Module = require('./models/moduleModel');
const ModuleAllocation = require('./models/moduleAllocationModel');
const AcademicLevel = require('./models/academicLevelModel');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const firstNames = [
    "Mohamed", "Ahmed", "Amine", "Yacine", "Karim", "Omar", "Youcef", "Bilal", "Samir", "Walid",
    "Fatima", "Amina", "Sarah", "Meriem", "Imane", "Khadija", "Zineb", "Asma", "Leila", "Noura",
    "Rachid", "Hassan", "Ali", "Brahim", "Khaled", "Nabil", "Sofiane", "Tarek", "Hichem", "Adel",
    "Yasmine", "Manel", "Rania", "Salma", "Hana", "Chaima", "Safa", "Marwa", "Ikram", "Wafa"
];

const lastNames = [
    "Benali", "Saidi", "Belkacem", "Dahmani", "Mokhtari", "Bouziane", "Zerrouki", "Rahmani", "Brahimi", "Mansouri",
    "Touati", "Moussaoui", "Ait", "Ouali", "Cherif", "Hamdi", "Bouzid", "Lounis", "Meziane", "Amrani",
    "Slimani", "Bouali", "Haddad", "Khelil", "Gherbi", "Fekir", "Belaid", "Talbi", "Chaib", "Derbal"
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateName = () => `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;

const generateStudentsCSV = async () => {
    console.log('Generating Students CSV...');
    const classes = await Class.find({}).sort({ name: 1 });

    let csvContent = "fullName,role,matricule,className\n";
    let matriculeCounter = 20241000;

    for (const cls of classes) {
        for (let i = 0; i < 20; i++) {
            const fullName = generateName();
            const matricule = matriculeCounter++;
            csvContent += `${fullName},STUDENT,${matricule},${cls.name}\n`;
        }
    }

    fs.writeFileSync(path.join(__dirname, '../../students_full.csv'), csvContent);
    console.log('students_full.csv generated successfully!');
};

const seedModulesAndTeachers = async () => {
    console.log('Cleaning up old data...');
    await ModuleAllocation.deleteMany({});
    // Also clear content and assignments as they depend on allocations
    await mongoose.connection.collection('modulecontents').deleteMany({});
    await mongoose.connection.collection('assignments').deleteMany({});
    await mongoose.connection.collection('submissions').deleteMany({});

    console.log('Seeding Modules and Teachers...');

    // 1. Create Teachers
    const teachers = [];
    for (let i = 0; i < 15; i++) {
        const fullName = generateName();
        const matricule = `T${1000 + i}`;

        let teacher = await User.findOne({ matricule });
        if (!teacher) {
            teacher = await User.create({
                fullName,
                role: 'TEACHER',
                matricule,
                username: matricule,
                password: matricule, // Will be hashed by pre-save
            });
        }
        teachers.push(teacher);
    }
    console.log(`${teachers.length} teachers available.`);

    // 2. Define Modules per Level
    const modulesData = {
        'CP1': [
            { name: 'Algorithmique 1', code: 'ALGO1', description: 'Introduction à l\'algorithmique' },
            { name: 'Structure Machine 1', code: 'SM1', description: 'Architecture des ordinateurs basique' },
            { name: 'Analyse 1', code: 'MATH1', description: 'Fonctions réelles' },
            { name: 'Algèbre 1', code: 'MATH2', description: 'Espaces vectoriels' },
            { name: 'Electricité', code: 'PHYS1', description: 'Circuits électriques' },
            { name: 'Bureautique', code: 'INFO1', description: 'Outils de bureau' },
            { name: 'Anglais 1', code: 'ENG1', description: 'Technical English' }
        ],
        'CP2': [
            { name: 'Algorithmique 3', code: 'ALGO3', description: 'Structures de données avancées' },
            { name: 'Architecture des Ordinateurs', code: 'ARCHI', description: 'Processeurs et mémoires' },
            { name: 'Systèmes d\'Information', code: 'SI', description: 'Modélisation des données' },
            { name: 'Probabilités', code: 'PROB', description: 'Probabilités et statistiques' },
            { name: 'Logique Mathématique', code: 'LOG', description: 'Logique formelle' }
        ],
        'CS1': [
            { name: 'Systèmes d\'Exploitation', code: 'SE', description: 'Gestion des processus et mémoire' },
            { name: 'Réseaux', code: 'RES', description: 'Modèle OSI, TCP/IP' },
            { name: 'Bases de Données', code: 'BDD', description: 'SQL et NoSQL' },
            { name: 'Génie Logiciel 1', code: 'GL1', description: 'Cycle de vie du logiciel' },
            { name: 'Compilation', code: 'COMP', description: 'Analyse lexicale et syntaxique' },
            { name: 'Théorie des Langages', code: 'THL', description: 'Automates et grammaires' }
        ],
        'CS2': [
            { name: 'Génie Logiciel 2', code: 'GL2', description: 'Design Patterns et Architecture' },
            { name: 'Applications Web', code: 'WEB', description: 'Frontend et Backend' },
            { name: 'Applications Mobiles', code: 'MOB', description: 'Android et iOS' },
            { name: 'Intelligence Artificielle', code: 'IA', description: 'Apprentissage automatique' },
            { name: 'Sécurité Informatique', code: 'SEC', description: 'Cryptographie et sécurité réseau' }
        ],
        'CS3': [
            { name: 'Gestion de Projets', code: 'GP', description: 'Méthodes agiles' },
            { name: 'Big Data', code: 'BIG', description: 'Hadoop et Spark' },
            { name: 'Cloud Computing', code: 'CLOUD', description: 'AWS et Azure' },
            { name: 'PFE', code: 'PFE', description: 'Projet de Fin d\'Etudes' }
        ]
    };

    // 3. Create Modules and Allocate to Levels
    const levels = await AcademicLevel.find({});

    for (const [levelKey, modulesList] of Object.entries(modulesData)) {
        // Find the actual level document
        const levelDoc = levels.find(l => l.name.startsWith(levelKey));
        if (!levelDoc) continue;

        for (const modData of modulesList) {
            // Create Module
            let module = await Module.findOne({ code: modData.code });
            if (!module) {
                module = await Module.create(modData);
            }

            // Assign a random teacher
            const teacher = getRandomElement(teachers);

            // Create level-based allocation
            const exists = await ModuleAllocation.findOne({ moduleId: module._id, levelId: levelDoc._id });
            if (!exists) {
                await ModuleAllocation.create({
                    moduleId: module._id,
                    levelId: levelDoc._id,
                    teacherIds: [teacher._id]
                });
            }
        }
    }
    console.log('Modules seeded and allocated to levels successfully!');
};

const run = async () => {
    await connectDB();
    await generateStudentsCSV();
    await seedModulesAndTeachers();
    process.exit();
};

run();
