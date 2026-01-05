const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Class = require('../models/classModel');

const importUsersFromCSV = (filePath, adminId) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    if (results.length === 0) {
                        console.log('CSV file is empty or headers do not match.');
                        resolve({ created: 0, skipped: 0, total: 0 });
                        return;
                    }

                    console.log(`Starting CSV import for ${results.length} rows...`);
                    const usersToCreate = [];
                    let skippedCount = 0;

                    // 1. Pre-fetch all classes and existing users FOR THIS ADMIN ONLY
                    const [allClasses, existingUsers] = await Promise.all([
                        Class.find({ adminId }).lean(),
                        User.find({ adminId }, 'matricule username').lean()
                    ]);

                    const classMap = new Map(allClasses.map(c => [c.name, c._id]));
                    const existingMatricules = new Set(existingUsers.map(u => u.matricule));
                    const existingUsernames = new Set(existingUsers.map(u => u.username));

                    // 2. Process rows and prepare data
                    for (let i = 0; i < results.length; i++) {
                        const row = results[i];

                        // Handle potential BOM or whitespace in keys
                        const cleanRow = {};
                        Object.keys(row).forEach(key => {
                            const cleanKey = key.replace(/^\ufeff/, '').trim();
                            cleanRow[cleanKey] = row[key];
                        });

                        const { fullName, role, matricule, className } = cleanRow;

                        if (!fullName || !role || !matricule) {
                            console.log(`Row ${i + 1} skipped: Missing required fields`, cleanRow);
                            skippedCount++;
                            continue;
                        }

                        const cleanMatricule = matricule.toString().trim();
                        const username = cleanMatricule;

                        if (existingMatricules.has(cleanMatricule) || existingUsernames.has(username)) {
                            console.log(`Row ${i + 1} skipped: Duplicate matricule/username (${cleanMatricule})`);
                            skippedCount++;
                            continue;
                        }

                        const cleanRole = role.toString().trim().toUpperCase();
                        if (cleanRole !== 'TEACHER' && cleanRole !== 'STUDENT') {
                            console.log(`Row ${i + 1} skipped: Invalid role (${cleanRole})`);
                            skippedCount++;
                            continue;
                        }

                        let classId = undefined;
                        if (className) {
                            classId = classMap.get(className.toString().trim());
                        }

                        usersToCreate.push({
                            fullName: fullName.toString().trim(),
                            role: cleanRole,
                            matricule: cleanMatricule,
                            username: username,
                            password: cleanMatricule, // Plain for now, will hash in bulk
                            classId: classId,
                            adminId: adminId,
                            firstLogin: true
                        });

                        // Add to set to prevent duplicates within the same CSV
                        existingMatricules.add(cleanMatricule);
                        existingUsernames.add(username);
                    }

                    if (usersToCreate.length > 0) {
                        console.log(`Hashing passwords for ${usersToCreate.length} users...`);
                        const salt = await bcrypt.genSalt(10);

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
                    resolve({ created: usersToCreate.length, skipped: skippedCount, total: results.length });
                } catch (error) {
                    console.error('CSV Import Error:', error);
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
