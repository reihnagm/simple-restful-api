const Company = require('../models/Company');
const fs = require('fs-extra');
const redis = require('../configs/redis');
const misc = require('../helpers/response');
module.exports = {
    getAll: async (request, response) => {
        const page = parseInt(request.query.page) || 1;
        const search = request.query.search || "";
        const limit = request.query.limit || 5;
        const sort = request.query.sort || "DESC";
        const sortBy = request.query.sortBy || "date_updated";
        const offset = (page - 1) * limit;
        try {
            const total = await Company.getTotal();
            const resultTotal = limit > 5 ? Math.ceil(total[0].total / limit) : total[0].total;
            const lastPage = Math.ceil(resultTotal / limit);
            const prevPage = page === 1 ? 1 : page - 1;
            const nextPage = page === lastPage ? 1 : page + 1;
            const data = await Company.getAll(offset, limit, sort, sortBy, search);
            const pageDetail = {
                total: resultTotal,
                per_page: limit,
                next_page: nextPage,
                prev_page: prevPage,
                current_page: page,
                nextLink: `${proccess.env.BASE_URL}${request.originalUrl.replace('page=' + page, 'page=' + nextPage)}`,
                prevLink: `${proccess.env.BASE_URL}${request.originalUrl.replace('page=' + page, 'page=' + prevPage)}`
            }
            misc.responsePagination(response, 200, false, "Successfull get all data.", pageDetail, data);
        } catch (error) {
            // console.log(error.message); in-development
            misc.response(response, 500, true, error.message);
        }
    },
    store: async (request, response) => {
        let error = false;
        let filename;
        let extension;
        let fileSize;
        if(request.file) {
            filename = request.file.originalname;
            extension =  request.file.originalname.split('.')[1];
            fileSize = request.file.fileSize;
        }
        try {
            if(request.file) {
                if(fileSize >= 5242880) { // size 5 MB
                    error = true;
                    fs.unlink(`public/images/company/${filename}`);
                    throw new Error("Oops!, Size cannot more than 5MB.");
                }
                if(!isImage(extension)) {
                    error = true;
                    fs.unlink(`public/images/company/${filename}`);
                    throw new Error("Oops!, File allowed only JPG, JPEG, PNG, GIF, SVG.");
                }
                function isImage(extension) {
                    switch (extension) {
                            case 'jpg':
                            case 'jpeg':
                            case 'png':
                            case 'gif':
                            case 'svg':
                                return true;
                            }
                            return false;
                    }
            }
            const data = {
                name: request.body.name,
                location: request.body.location,
                description: request.body.description,
                email: request.body.email,
                telephone: request.body.telephone,
                logo: request.file ? request.file.originalname : "",
                user_id: request.body.user_id
            }
            await Company.store(data);
            misc.response(response, 200, false, "Successfull create data.", data);
        } catch(error) {
            misc.response(response, 500, true, error.message);
        }
    },
    update: async (request, response) => {
        let error = false;
        let filename;
        let extension;
        let fileSize;
        if(request.file) {
            filename = request.file.originalname;
            extension =  request.file.originalname.split('.')[1];
            fileSize = request.file.fileSize;
        }
        try {
            if(request.file) {
                if(fileSize >= 5242880) {
                    error = true;
                    fs.unlink(`public/images/company/${filename}`);
                    throw new Error('Oops!, Size cannot more than 5MB.');
                }
                if(!isImage(extension)) {
                    error = true;
                    fs.unlink(`public/images/company/${filename}`);
                    throw new Error('Oops!, File allowed only JPG, JPEG, PNG, GIF, SVG.');
                }
                function isImage(extension) {
                switch (extension) {
                    case 'jpg':
                    case 'jpeg':
                    case 'png':
                    case 'gif':
                    case 'svg':
                        return true;
                    }
                    return false;
                }
            }
            let logo;
            if(request.file) {
                logo = request.file.originalname;
            } else {
                logo = request.body.logo;
            }
            const data = {
                name: request.body.name,
                location: request.body.location,
                description: request.body.description,
                email: request.body.email,
                telephone: request.body.telephone,
                logo,
                user_id: request.body.user_id
            }
            if(error === false) {
                let name = request.body.name;
                let company_id = request.params.id;
                let user_id = request.body.user_id;
                let slug = name.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');
                await Company.update(data, company_id);
                await Company.updateNameUser(name, slug, user_id);
                misc.response(response, 200, false, 'Succesfull update data.', data);
                redis.flushall();
            }
        } catch(error) {
            misc.response(response, 500, true, error.message);
        }
    },
    edit: async (request, response) => {
        try {
            const company_id = request.params.id;
            const data = await Company.edit(company_id);
            misc.response(response, 200, false, 'Successfull edit data.', data);
        } catch(error) {
            misc.response(response, 500, true, error.message);
        }
    },
    delete: async (request, response) => {
        try {
            const company_id = request.params.id;
            await Company.delete(company_id);
            misc.response(response, 200, false, 'Successfull delete data.');
        } catch(error) {
            misc.response(response, 500, true, error.message);
        }
    },
    getProfile: async (request, response) => {
        const user_id = request.body.user_id;
        try {
            const data = await Company.getProfile(user_id);
            redis.get(`user_id_companies:${user_id}`, (errorRedis, resultRedis) => {
                if(resultRedis) {
                    if(typeof user_id !== "undefined") {
                        misc.response(response, 200, false, 'Successfull get profile with redis.', JSON.parse(resultRedis));
                    }
                } else {
                    if(typeof user_id !== "undefined") {
                        redis.setex(`user_id_companies:${user_id}`, 3600, JSON.stringify(data[0]));
                        misc.response(response, 200, false, 'Successfull get profile.', data[0]);
                    }
                }
           });
        } catch(error) {
            misc.response(response, 500, true, error.message);
        }
    },
    getProfileBySlug: async (request, response) => {
        const slug = request.params.slug;
        try {
            const data = await Company.getProfileBySlug(slug);
            misc.response(response, 200, false, 'Successfull get profile by slug.', data[0]);
        } catch(error) {
            misc.response(response, 500, true, error.message);
        }
    }
}
