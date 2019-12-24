const connection = require('../configs/db')

module.exports = {

    getCountAll: () => {
        return new Promise ((resolve, reject) => {
            const query = `SELECT COUNT(*) total from engineer`
            connection.query(query, (error, result) => {
                if(error) {
                    reject(new Error(error))
                } else {
                    resolve(result)
                }
            })
        })
    },
    all: (offset, limit, sort, sortBy, search) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM engineer WHERE (name LIKE '%${search}%' or skill LIKE '%${search}%')
            ORDER BY ${sortBy} ${sort} LIMIT ${offset}, ${limit}`

            connection.query(query, (error, result) => {
                if (error) {
                    reject(new Error(error))
                } else {
                    resolve(result)
                }
            })
        })
    },
    store: (name, description, skill, location, birthdate, showcase, email, telephone, salary, avatar) => {
        return new Promise((resolve, reject) => { // NOTE: if you want insert values, dont forget single qoute, and restart server npm
                connection.query(`INSERT INTO engineer (name, description, skill, location, birthdate, showcase, email, telephone, salary, avatar) VALUES ('${name}', '${description}', '${skill}', '${location}', STR_TO_DATE('${birthdate}', '%Y-%m-%d'), '${showcase}', '${email}', '${telephone}', '${salary}', '${avatar}')`, (error, result) => {
                if (error) {
                    reject(new Error(error))
                } else {
                    resolve(result)
                }
            })
        })
    },
    // store: (data) => {
    //     return new Promise((resolve, reject) => { // NOTE: if you want insert values, dont forget single qoute, and restart server npm
    //             connection.query(`INSERT INTO engineer SET ?`, data, (error, result) => {
    //             if (error) {
    //                 reject(new Error(error))
    //             } else {
    //                 resolve(result)
    //             }
    //         })
    //     })
    // },
    edit: (id) => {
        return new Promise((resolve, reject) => {
            connection.query(`SELECT * FROM engineer WHERE id = ${id}`, (error, result) => {
            if (error) {
                reject(new Error(error))
            } else {
                resolve(result)
            }
            })
        })
    },
    update: (data, id) => {
        return new Promise((resolve, reject) => {
            connection.query('UPDATE engineer SET ? WHERE id = ?', [data, id], (error, result) => {
                if (err) {
                    reject(new Error(error))
                } else {
                    resolve(result)
                }
            })
        })
    },
    delete: (id) => {
        return new Promise((resolve, reject) => {
                connection.query('DELETE FROM engineer WHERE id = ?', id, (error, result) => {
                if (error) {
                    reject(new Error(error))
                } else {
                    resolve(result)
                }
            })
        })
    },
    saveAvatar: (avatar) => {
        return new Promise((resolve, reject) => {
            connection.query(`UPDATE engineer SET avatar = '${avatar}'`, (error, result) => {
                if(error) {
                    reject(new Error(error))
                } else {
                    resolve(result)
                }
            })
        })
    }
}
