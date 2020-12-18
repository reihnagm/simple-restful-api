const Engineer = require('../models/Engineer')
const fs = require('fs-extra')
const redis = require('../configs/redis')
const misc = require('../helpers/response')

module.exports = {

  all: async (request, response) => {
    const page = parseInt(request.query.page) || 1
    const search = request.query.search || ''
    const sort = request.query.sort || 'DESC'
    const sortBy = request.query.sortBy || 'date_updated'
    const limit = request.query.limit || 5
    const offset = (page - 1) * limit
    try {
      const total = await Engineer.total()
      const resultTotal = limit > 5 ? Math.ceil(total[0].total / limit) : total[0].total
      const lastPage = Math.ceil(resultTotal / limit)
      const prevPage = page === 1 ? 1 : page - 1
      const nextPage = page === lastPage ? 1 : page + 1
      const data = await Engineer.all(offset, limit, sort, sortBy, search)
      const pageDetail = {
        total: resultTotal,
        per_page: lastPage,
        next_page: nextPage,
        prev_page: prevPage,
        current_page: page,
        next_url: `${process.env.BASE_URL}${request.originalUrl.replace('page=' + page, 'page=' + nextPage)}`,
        prev_url: `${process.env.BASE_URL}${request.originalUrl.replace('page=' + page, 'page=' + prevPage)}`
      }
      misc.responsePagination(response, 200, false, null, pageDetail, data)
    } catch (error) {
      console.log(error.message) // in-development
      misc.response(response, 500, true, 'Server Error.')
    }
  },

  store: async (request, response) => {
    let error = false
    let filename
    let extension
    let fileSize
    if(request.file) {
      filename = request.file.originalname
      extension =  request.file.originalname.split('.')[1]
      fileSize = request.file.fileSize
    }
    try {
      if(request.file) {
        if(fileSize >= 5242880) { // 5 MB
          error = true
          fs.unlink(`public/images/engineer/${filename}`)
          throw new Error('Oops!, Size cannot more than 5MB.')
        }
        if(!isImage(extension)) {
          error = true
          fs.unlink(`public/images/engineer/${filename}`)
          throw new Error('Oops!, File allowed only JPG, JPEG, PNG, GIF, SVG.')
        }
        function isImage(extension) {
          switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
              return true
          }
            return false
        }
      }
      const data = {
        description: request.body.description,
        skill: request.body.skill,
        location: request.body.location,
        birthdate: request.body.birthdate,
        showcase: request.body.showcase,
        telephone: request.body.telephone,
        salary: request.body.salary,
        avatar: request.file ? request.file.originalname : request.body.avatar,
        user_id: request.body.user_id
      }
      if(error === false) {
        await Engineer.store(data)
        misc.response(response, 200, false, null, data)
        redis.flushall()
      }
    } catch (error) {
      console.log(error.message) // in-development
      misc.response(response, 500, true, 'Server Error')
    }
  },

  update: async (request, response) => {
    const engineerId = request.params.id
    const userId = request.body.user_id
    const name = request.body.name
    const slug = name.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'')
    const description = request.body.description 
    const location = request.body.location
    const birthdate = request.body.birthdate
    const showcase = request.body.showcase
    const telephone = request.body.telephone
    const salary = request.body.salary

    // All skills selected 
    const skillsStore = JSON.parse(request.body.skillsStore)

     // All skills unselected
    const skillsDestroy = JSON.parse(request.body.skillsDestroy) 

    // Store skills
    for(let z = 0; z < skillsStore.length; z++) {
      const checkSkills = await Engineer.checkSkills(skillsStore[z].id, engineerId)
      if(checkSkills.length == 0) {
        await Engineer.storeSkills(skillsStore[z].id, engineerId)
      }
    }


    // Delete skills
    for (let i = 0; i < skillsDestroy.length; i++) {
      for (let z = 0; z < skillsDestroy[i].length; z++) {
        await Engineer.destroySkills(skillsDestroy[i][z].id, engineerId)
      }
    }


    let error = false
    let filename
    let extension
    let fileSize
    if(request.file) {
      filename = request.file.originalname
      extension =  request.file.mimetype
      fileSize = request.file.fileSize
    }
    try {
      if(request.file) {
        if(fileSize >= 5242880) {
          error = true
          fs.unlink(`public/images/engineer/${filename}`)
          throw new Error('Oops! size cannot more than 5MB')
        }
        if(!isImage(extension)) {
          error = true
          fs.unlink(`public/images/engineer/${filename}`)
          throw new Error('Oops! file allowed only JPG, JPEG, PNG, GIF, SVG')
        }
        function isImage(extension) {
          switch (extension) {
            case 'image/png':
            case 'image/jpeg':
            case 'image/gif':
            case 'image/bmp':
            case 'image/svg+xml':
              return true
          }
          return false
        }
      }
      let avatar
      if(request.file) {
        avatar = request.file.originalname
      } else {
        avatar = request.body.avatar
      }
      const data = {
        description: description,
        location: location,
        birthdate: birthdate,
        showcase: showcase,
        telephone: telephone,
        salary: salary,
        avatar,
        user_id: userId
      }
      if(error === false) {
        await Engineer.update(data, engineerId)
        await Engineer.updateNameUser(name, slug, userId)
        misc.response(response, 200, false, null, data)
      }
      redis.flushall()
    } catch (error) {
      console.log(error.message) // in-development
      misc.response(response, 500, true, 'Server Error.')
    }
  },

  delete: async (request, response) => {
    const engineer_id = request.params.engineer_id
    const user_id = request.params.user_id
    try {
      await Engineer.delete(engineer_id)
      await Engineer.deleteUser(user_id)
      misc.response(response, 200, null, false)
      redis.flushall()
    } catch(error) {
      console.log(error.message) // in-development
      misc.response(response, 500, true, 'Server Error.')
    }
  },

  getSkills: async (request, response) => {
    try {
      const data = await Engineer.getSkills()
      misc.response(response, 200, false, null, data)
    } catch (error) {
      console.log(error.message) // in-development
      misc.response(response, 500, true, 'Server Error.')
    }
  },

  getProfile: async (request, response) => {
    const userId = request.body.user_id
    try {
      let profileObject = {}
      let profile = await Engineer.getProfile(userId)
      const skills = await Engineer.getSkillsBasedOnProfile(profile[0].id)

  
      profileObject.id = profile[0].id
      profileObject.description = profile[0].description
      profileObject.location = profile[0].location
      profileObject.birthdate = profile[0].birthdate
      profileObject.showcase = profile[0].showcase
      profileObject.telephone = profile[0].telephone
      profileObject.avatar = profile[0].avatar
      profileObject.salary = profile[0].salary
      profileObject.user_id = profile[0].user_id
      profileObject.date_created = profile[0].date_created
      profileObject.date_updated = profile[0].date_updated
      profileObject.name = profile[0].name
      profileObject.email = profile[0].email
      profileObject.skills = skills
    
      
      misc.response(response, 200, false, null, profileObject) 
    } catch(error) {
      console.log(error.message) // in-development
      misc.response(response, 500, true, 'Server Error.')
    }
  },

  getProfileBySlug: async (request, response) => {
    const slug = request.params.slug
    try {
      let profileBySlugObject = {}
      const profileBySlug = await Engineer.getProfileBySlug(slug)
      const skills = await Engineer.getSkillsBasedOnProfile(profileBySlug[0].id)

      profileBySlugObject.id = profileBySlug[0].id
      profileBySlugObject.description = profileBySlug[0].description
      profileBySlugObject.location = profileBySlug[0].location
      profileBySlugObject.birthdate = profileBySlug[0].birthdate
      profileBySlugObject.showcase = profileBySlug[0].showcase
      profileBySlugObject.telephone = profileBySlug[0].telephone
      profileBySlugObject.avatar = profileBySlug[0].avatar
      profileBySlugObject.salary = profileBySlug[0].salary
      profileBySlugObject.user_id = profileBySlug[0].user_id
      profileBySlugObject.date_created = profileBySlug[0].date_created
      profileBySlugObject.date_updated = profileBySlug[0].date_updated
      profileBySlugObject.name = profileBySlug[0].name
      profileBySlugObject.email = profileBySlug[0].email
      profileBySlugObject.skills = skills
    

      misc.response(response, 200, false, null, profileBySlugObject)
    } catch(error) {
      console.log(error.message) // in-development
      misc.response(response, 500, true, 'Server Error.')
    }
  }
  
}
