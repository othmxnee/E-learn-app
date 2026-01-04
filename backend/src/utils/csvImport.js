const fs = require('fs');
const csv = require('csv-parser');
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
                    const usersToCreate = [];
                    let skippedCount = 0;

                    // Pre-fetch all classes to minimize DB queries inside loop
                    const allClasses = await Class.find({}).lean();
                    const classMap = new Map(allClasses.map(c => [c.name, c._id.toString()]));

                    for (const row of results) {
                        // Expected CSV columns: fullName, role, matricule, className (optional)
                        if (!row.fullName || !row.role || !row.matricule) {
                            skippedCount++;
                            continue;
                        }

                        // Basic validation
                        if (row.role !== 'TEACHER' && row.role !== 'STUDENT') {
                            skippedCount++;
                            continue;
                        }
                        if (!/^\d+$/.test(row.matricule)) {
                            skippedCount++;
                            continue;
                        }

                        const exists = await User.findOne({ matricule: row.matricule });
                        if (exists) {
                            skippedCount++;
                            continue;
                        }

                        let classId = undefined;
                        if (row.className) {
                            // Try to find class by name (e.g., "CS2-IS-1")
                            const foundClassId = classMap.get(row.className.trim());
                            if (foundClassId) {
                                classId = foundClassId;
                            } else {
                                console.warn(`Class not found for name: ${row.className}`);
                            }
                        }

                        usersToCreate.push({
                            fullName: row.fullName.trim(),
                            role: row.role.trim(),
                            matricule: row.matricule.trim(),
                            username: row.matricule.trim(),
                            password: row.matricule.trim(), // Default password
                            classId: classId,
                        });
                    }

                    // Use individual save() calls to trigger password hashing
                    let createdCount = 0;
                    for (const userData of usersToCreate) {
                        const user = new User(userData);
                        await user.save();
                        createdCount++;
                    }

                    // Clean up file
                    fs.unlinkSync(filePath);

                    console.log(`CSV Import: ${createdCount} created, ${skippedCount} skipped`);
                    resolve(createdCount);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => reject(error));
    });
};

module.exports = importUsersFromCSV;
