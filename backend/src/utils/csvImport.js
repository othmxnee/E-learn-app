const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Class = require('../models/classModel');

const importUsersFromCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    console.log(`Starting CSV import for ${results.length} rows...`);
                    const usersToCreate = [];
                    let skippedCount = 0;

                    // 1. Pre-fetch all classes and existing matricules to minimize DB queries
                    const [allClasses, existingUsers] = await Promise.all([
                        Class.find({}).lean(),
                        User.find({}, 'matricule').lean()
                    ]);

                    const classMap = new Map(allClasses.map(c => [c.name, c._id]));
                    const existingMatricules = new Set(existingUsers.map(u => u.matricule));

                    // 2. Process rows and prepare data
                    for (const row of results) {
                        if (!row.fullName || !row.role || !row.matricule) {
                            skippedCount++;
                            continue;
                        }

                        const matricule = row.matricule.trim();
                        if (existingMatricules.has(matricule)) {
                            skippedCount++;
                            continue;
                        }

                        if (row.role !== 'TEACHER' && row.role !== 'STUDENT') {
                            skippedCount++;
                            continue;
                        }

                        let classId = undefined;
                        if (row.className) {
                            classId = classMap.get(row.className.trim());
                        }

                        // We'll hash passwords in the next step to avoid blocking the loop
                        usersToCreate.push({
                            fullName: row.fullName.trim(),
                            role: row.role.trim(),
                            matricule: matricule,
                            username: matricule,
                            password: matricule, // Plain for now, will hash in bulk
                            classId: classId,
                            firstLogin: true
                        });

                        // Add to set to prevent duplicates within the same CSV
                        existingMatricules.add(matricule);
                    }

                    if (usersToCreate.length > 0) {
                        console.log(`Hashing passwords for ${usersToCreate.length} users...`);
                        const salt = await bcrypt.genSalt(10);

                        // Hash passwords in parallel chunks to avoid overwhelming the CPU
                        const hashedUsers = await Promise.all(usersToCreate.map(async (u) => {
                            const hashedPassword = await bcrypt.hash(u.password, salt);
                            return { ...u, password: hashedPassword };
                        }));

                        console.log(`Inserting ${hashedUsers.length} users into database...`);
                        await User.insertMany(hashedUsers, { ordered: false });
                    }

                    // Clean up file
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }

                    console.log(`CSV Import Complete: ${usersToCreate.length} created, ${skippedCount} skipped`);
                    resolve(usersToCreate.length);
                } catch (error) {
                    console.error('CSV Import Error:', error);
                    // Still try to clean up
                    if (fs.existsSync(filePath)) {
                        try { fs.unlinkSync(filePath); } catch (e) { }
                    }
                    reject(error);
                }
            })
            .on('error', (error) => reject(error));
    });
};

module.exports = importUsersFromCSV;
