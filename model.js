const { Sequelize, Model, QueryTypes, DataTypes } = require('sequelize');
const Pusher = require("pusher")

const dbConfig = require("./config");
const moment = require("moment");
const axios = require("axios");
const xl = require('excel4node');
const wb = new xl.Workbook();
const fremove = require('find-remove');
const excelToJSON = require("convert-excel-to-json");
const fs = require("fs");
const uniq = require('unique_array');
// const metadata = require("./model_metadata");

const pusher = new Pusher({
  appId: "1097558",
  key: "c28178cff73d32dbcc9c",
  secret: "c989e229280c0be158c1",
  // useTLS: USE_TLS, // optional, defaults to false
  cluster: "ap1", // if `host` is present, it will override the `cluster` option.
  // host: "HOST", // optional, defaults to api.pusherapp.com
  // port: PORT, // optional, defaults to 80 for non-TLS connections and 443 for TLS connections
  // encryptionMasterKeyBase64: ENCRYPTION_MASTER_KEY, // a base64 string which encodes 32 bytes, used to derive the per-channel encryption keys (see below!)
})

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: '170.249.211.10',
    port: 3306,
    // host: "localhost",
    dialect: dbConfig.dialect,
    operatorsAliases: 0,
    logging: false,
    timezone : "-05:00",
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    },
    dialectOptions: {
      connectTimeout: 60000
    },
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  });
const Op = Sequelize.Op;

class LG extends Model {}
class Images extends Model {}
class Spec extends Model {}
class History extends Model {}
class Brand extends Model {}
class Features extends Model {}
class Progress extends Model {}
class Menus extends Model{}
class Datas extends Model{}
class Manual extends Model{}
class SubMenu extends Model{}
class Filter extends Model{}
class DatasDetail extends Model{}
class Category extends Model{}
class DetailCategory extends Model{}
class SubCategory extends Model{}
class RelatedColor extends Model{}
class FilterProduct extends Model{}
class StatusLog extends Model{}
class ErrorsLog extends Model{}
class ScrapeResult extends Model{}
class ScrapeLog extends Model{}
class DataCompleteness extends Model{}
class DataDetailCompleteness extends Model{}
class FilterAppConn extends Model{}
class Reviews extends Model{}
class Cookie extends Model {}

// live product table
class BaseProduct extends Model{}
class DataCompletenessLive extends Model{}

LG.init({
    sku: DataTypes.STRING,
    original_sku: DataTypes.STRING,
    brand_id: DataTypes.STRING,
    old_name : DataTypes.STRING,
    name : DataTypes.STRING,
    color : DataTypes.STRING,
    original_color : DataTypes.STRING,
    price: DataTypes.DOUBLE,
    category : DataTypes.STRING,
    subcategory : DataTypes.STRING,
    detail_category : DataTypes.STRING,
    detail_category_id : DataTypes.INTEGER,
    link : DataTypes.TEXT,
    upc : DataTypes.STRING,
    manual_guides_link : DataTypes.TEXT,
    spec_download_link : DataTypes.TEXT,
    energy_guide_download_link : DataTypes.TEXT,
    compliance_link : DataTypes.TEXT,
    status : DataTypes.STRING,
    created_at : DataTypes.STRING,
    updated_at : DataTypes.STRING,
    is_manual : DataTypes.INTEGER,
    is_custom : DataTypes.INTEGER
    // features : DataTypes.TEXT
  // }, { sequelize, modelName: 'v4_product_datas' });
}, { sequelize, modelName: 'v4_product_datas' });

Datas.init({
  sku: DataTypes.STRING,
  original_sku: DataTypes.STRING,
  brand_id: DataTypes.INTEGER,
  old_name : DataTypes.STRING,
  name : DataTypes.STRING,
  color : DataTypes.STRING,
  original_color : DataTypes.STRING,
  price: DataTypes.DOUBLE,
  category : DataTypes.STRING,
  subcategory : DataTypes.STRING,
  detail_category : DataTypes.STRING,
  detail_category_id : DataTypes.STRING,
  v3_category : DataTypes.STRING,
  v3_subcategory : DataTypes.STRING,
  v3_detail_category : DataTypes.STRING,
  new_category : DataTypes.STRING,
  new_subcategory : DataTypes.STRING,
  new_detail_category : DataTypes.STRING,
  new_detail_category_filter : DataTypes.STRING,
  detail_category_id : DataTypes.INTEGER,
  link : DataTypes.TEXT,
  upc : DataTypes.STRING,
  status : DataTypes.STRING,
  is_manual : DataTypes.INTEGER,
  created_at : DataTypes.DATE,
  updated_at : DataTypes.DATE,
  is_custom : DataTypes.INTEGER
}, { sequelize, modelName: 'v4_product_datas' });

Manual.init({
  brand_id: DataTypes.INTEGER,
  sku: DataTypes.STRING,
  original_sku: DataTypes.STRING,
  name : DataTypes.STRING,
  price: DataTypes.DOUBLE,
  color : DataTypes.STRING,
  original_color : DataTypes.STRING,
  link : DataTypes.TEXT,
  upc : DataTypes.STRING,
  detail_category_id : DataTypes.INTEGER,
  category : DataTypes.STRING,
  subcategory : DataTypes.STRING,
  detail_category : DataTypes.STRING,
  v3_category : DataTypes.STRING,
  v3_subcategory : DataTypes.STRING,
  v3_detail_category : DataTypes.STRING,
  ajmadison_categories : DataTypes.STRING,
  new_category : DataTypes.STRING,
  new_subcategory : DataTypes.STRING,
  new_detail_category : DataTypes.STRING,
  manual_guides_link : DataTypes.STRING,
  spec_download_link : DataTypes.STRING,
  energy_guide_download_link : DataTypes.STRING,
  compliance_link : DataTypes.STRING,
  product_status : DataTypes.STRING,
  status : DataTypes.STRING,
  exist : DataTypes.STRING,
  created_at : DataTypes.STRING,
  updated_at : DataTypes.STRING
}, { sequelize, modelName: 'v4_product_datas' });

RelatedColor.init({
  product_id: DataTypes.INTEGER,
  product_related_id: DataTypes.INTEGER,
  sku: DataTypes.STRING,
  color: DataTypes.STRING
}, { sequelize, modelName: 'v4_color_related_products' });

Images.init({
  product_id: DataTypes.INTEGER,
  sku : DataTypes.STRING,
  type : DataTypes.INTEGER,
  url : DataTypes.TEXT,
  role : DataTypes.STRING,
  content_length : DataTypes.STRING,
  document_type : DataTypes.INTEGER,
  priority : DataTypes.INTEGER
// }, { sequelize, modelName: 'v4_product_assets' });
}, { sequelize, modelName: 'v4_product_assets' });
Spec.init({
  product_id : DataTypes.INTEGER,
  section: DataTypes.TEXT,
  category: DataTypes.TEXT,
  feature: DataTypes.TEXT,
  type: DataTypes.INTEGER,
// }, { sequelize, modelName: 'v4_product_specs' });
}, { sequelize, modelName: 'v4_product_specs' });
Features.init({
  product_id: DataTypes.INTEGER,
  sku : DataTypes.STRING,
  feature : DataTypes.TEXT,
  description : DataTypes.TEXT,
  image : DataTypes.TEXT,
  video : DataTypes.TEXT,
  priority : DataTypes.INTEGER,
  type : DataTypes.INTEGER,
  view_type : DataTypes.STRING,
// }, { sequelize, modelName: 'v4_product_main_features' });
}, { sequelize, modelName: 'v4_product_main_features' });

History.init({
  sku: DataTypes.STRING,
  product_id: DataTypes.INTEGER,
  brand_id: DataTypes.INTEGER,
  name : DataTypes.STRING,
  price: DataTypes.DOUBLE,
  created_at : DataTypes.STRING,
  brand_name : DataTypes.STRING,
  is_new : DataTypes.INTEGER
  
// }, { sequelize, modelName: 'v4_product_histories' });
}, { sequelize, modelName: 'v4_product_histories' });
Brand.init({
  name: DataTypes.STRING,
  slug : DataTypes.STRING,
  have_price : DataTypes.SMALLINT,
  scraping_method : DataTypes.INTEGER,
  priority : DataTypes.INTEGER,
  total_best_seller : DataTypes.INTEGER
// }, { sequelize, modelName: 'v4_product_brands' });
}, { sequelize, modelName: 'v4_product_brands' });
Progress.init({
  brand_slug: DataTypes.STRING,
  status : DataTypes.STRING
}, { sequelize, freezeTableName: true, modelName: 'scrape_product_progress' });

// LG.belongsTo(Brand, {foreignKey: 'brand_id'})

Menus.init({
  brand_id: DataTypes.INTEGER,
  sku: DataTypes.STRING,
  link: DataTypes.TEXT,
  v3_category: DataTypes.STRING,
  v3_subcategory: DataTypes.STRING,
  v3_detail_category: DataTypes.STRING,
  v4_product_menu: DataTypes.STRING,
  v4_product_submenu: DataTypes.STRING,
  v4_product_filter: DataTypes.STRING,
  created_at: DataTypes.STRING,
  updated_at: DataTypes.STRING
}, { sequelize, modelName: 'v4_product_menu_filter' });

SubMenu.init({
  menu_id: DataTypes.INTEGER,
  name: DataTypes.STRING,
  slug: DataTypes.STRING
}, { sequelize, modelName: 'v4_product_submenu' });

Filter.init({
  submenu_id: DataTypes.INTEGER,
  name: DataTypes.STRING,
  slug: DataTypes.STRING
}, { sequelize, modelName: 'v4_product_filter' });

DatasDetail.init({
  product_id: DataTypes.INTEGER,
  detail_category_id: DataTypes.INTEGER,
  status: DataTypes.INTEGER
}, { sequelize, modelName: 'v4_product_datas_category'});

Category.init({
  name: DataTypes.STRING,
  slug: DataTypes.STRING
}, { sequelize, modelName: 'v4_product_categories' });

SubCategory.init({
  category_id: DataTypes.INTEGER,
  name: DataTypes.STRING,
  slug: DataTypes.STRING
}, { sequelize, modelName: 'v4_product_subcategories' });

DetailCategory.init({
  subcategory_id: DataTypes.INTEGER,
  name: DataTypes.STRING,
  slug: DataTypes.STRING
}, { sequelize, modelName: 'v4_product_detail_categories' });

FilterProduct.init({
  product_id: DataTypes.INTEGER,
  subcategory_id: DataTypes.INTEGER,
  section: DataTypes.STRING,
  field: DataTypes.STRING,
  value: DataTypes.STRING,
  is_from_app: DataTypes.INTEGER
}, { sequelize, modelName: 'v4_product_datas_filters' });

FilterAppConn.init({
  product_id: DataTypes.INTEGER,
  subcategory_id: DataTypes.INTEGER,
  section: DataTypes.STRING,
  field: DataTypes.STRING,
  value: DataTypes.STRING,
  status: DataTypes.STRING,
  is_injected: DataTypes.INTEGER,
  created_at: DataTypes.STRING,
  injected_at: DataTypes.STRING
}, { sequelize, modelName: 'v4_filter_app_conn' });

StatusLog.init({
  product_id: DataTypes.INTEGER,
  brand: DataTypes.STRING,
  sku: DataTypes.STRING,
  old_status : DataTypes.STRING,
  status: DataTypes.STRING,
  created_at : DataTypes.STRING
}, { sequelize, modelName: 'v4_product_status_log' });

ErrorsLog.init({
  file: DataTypes.TEXT,
  brand_id: DataTypes.INTEGER,
  message: DataTypes.STRING,
  error_detail: DataTypes.TEXT,
  total_error: DataTypes.INTEGER,
  solved: DataTypes.INTEGER,
  created_at: DataTypes.STRING,
  solved_at: DataTypes.STRING
}, { sequelize, modelName: 'errors_logs' });

ScrapeResult.init({
  brand_id: DataTypes.INTEGER,
  status: DataTypes.INTEGER,
  total_scraped: DataTypes.INTEGER,
  total_active: DataTypes.INTEGER,
  total_discontinued: DataTypes.INTEGER,
  new_products: DataTypes.INTEGER,
  error: DataTypes.INTEGER,
  last_scrape: DataTypes.STRING,
}, {sequelize, modelName: 'scraping_result'});

ScrapeLog.init({
  brand_id: DataTypes.INTEGER,
  total: DataTypes.INTEGER,
  total_active: DataTypes.INTEGER,
  total_discontinued: DataTypes.INTEGER,
  total_duplicate: DataTypes.INTEGER,
  total_custom: DataTypes.INTEGER,
  total_changed_status: DataTypes.INTEGER,
  date: DataTypes.STRING,
  scrape_order: DataTypes.INTEGER,
}, { sequelize, modelName: 'scrape_logs' });

DataCompleteness.init({
  brand_id: DataTypes.INTEGER,
  total_product: DataTypes.INTEGER,
  total_active: DataTypes.INTEGER,
  total_discontinued: DataTypes.INTEGER,
  total_custom: DataTypes.INTEGER,
  total_duplicate: DataTypes.INTEGER,
  have_no_category: DataTypes.INTEGER,
  have_no_color_relation: DataTypes.INTEGER,
  have_no_filter: DataTypes.INTEGER,
  have_no_name: DataTypes.INTEGER,
  have_no_color: DataTypes.INTEGER,
  have_no_images: DataTypes.INTEGER,
  have_no_features: DataTypes.INTEGER,
  have_no_docs: DataTypes.INTEGER,
  have_no_specs: DataTypes.INTEGER,
  have_no_upc: DataTypes.INTEGER,
  updated_at: DataTypes.STRING,
  completeness: DataTypes.STRING,
}, { sequelize, modelName: 'data_completeness' });

BaseProduct.init({
  scrape_id: DataTypes.INTEGER,
  key: DataTypes.STRING,
  link: DataTypes.STRING,
  brand_id: DataTypes.INTEGER,
  detail_category_id: DataTypes.INTEGER,
  status: DataTypes.STRING,
  is_custom: DataTypes.INTEGER,
  is_published: DataTypes.INTEGER,
  is_image_validated: DataTypes.INTEGER,
  deleted_at : DataTypes.DATE,
  created_at : DataTypes.DATE,
  updated_at : DataTypes.DATE
}, { sequelize, modelName: 'v4_base_product' });

DataCompletenessLive.init({
  brand_id: DataTypes.INTEGER,
  total_product: DataTypes.INTEGER,
  total_active: DataTypes.INTEGER,
  total_discontinued: DataTypes.INTEGER,
  total_custom: DataTypes.INTEGER,
  total_duplicate: DataTypes.INTEGER,
  have_no_category: DataTypes.INTEGER,
  have_no_color_relation: DataTypes.INTEGER,
  have_no_filter: DataTypes.INTEGER,
  have_no_name: DataTypes.INTEGER,
  have_no_color: DataTypes.INTEGER,
  have_no_images: DataTypes.INTEGER,
  have_no_features: DataTypes.INTEGER,
  have_no_docs: DataTypes.INTEGER,
  have_no_specs: DataTypes.INTEGER,
  have_no_upc: DataTypes.INTEGER,
  updated_at: DataTypes.STRING,
  completeness: DataTypes.STRING,
}, { sequelize, modelName: 'data_completeness_live' });

DataDetailCompleteness.init({
  brand_id: DataTypes.INTEGER,
  total_product: DataTypes.INTEGER,
  type: DataTypes.STRING,
  status: DataTypes.STRING,
  attribute: DataTypes.STRING,
  count: DataTypes.INTEGER,
}, { sequelize, modelName: 'data_detail_completeness'});

Reviews.init({
  product_id: DataTypes.INTEGER,
  sku: DataTypes.STRING,
  date: DataTypes.STRING,
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  order_id: DataTypes.STRING,
  submission_id: DataTypes.STRING,
  star_rating: DataTypes.INTEGER,
  title: DataTypes.STRING,
  comment: DataTypes.TEXT,
  location: DataTypes.STRING,
  replies: DataTypes.TEXT,
  image_1: DataTypes.TEXT,
  image_2: DataTypes.TEXT,
  image_3: DataTypes.TEXT,
  video: DataTypes.TEXT,
  created_at: DataTypes.STRING,
}, { sequelize, modelName: 'v4_product_reviews' });

Cookie.init({
  cookies: DataTypes.TEXT,
  menu: DataTypes.INTEGER,
  which_url: DataTypes.TEXT,
  total_scraped: DataTypes.INTEGER,
  last_url: DataTypes.TEXT,
  last_updated: DataTypes.STRING,
  is_error: DataTypes.INTEGER,
}, { sequelize, modelName: 'lowes_cookies' });

exports.saveSpec = async data => {
  let exist = await Spec.findOne({
    where: {
        product_id : data.product_id,
        section : data.section,
        category : data.category
        // feature : data.feature
    },
    
  }).then((data) => {return data})

  let type = null
  if(data.section != null && data.category != null && data.feature != null){
    type = 1
  }else if(data.section == null && data.category != null && data.feature != null){
    type = 2
  }else if(data.section != null && data.category == null && data.feature != null){
    type = 3
  }else{
    type = 2
    data.feature = data.feature != null?data.feature:data.category.includes('Width') || data.category.includes('Depth') || data.category.includes('Height') || data.category.includes('Total') || data.category.includes('Capacity')?'-':'Yes'
  }

  if(!exist){
    await Spec.create({
      product_id : data.product_id,
      section: data.section,
      category: data.category,
      feature: data.feature,
      type: type,
    });
  }else{
    await Spec.update({feature : data.feature, type : type}, {
      where: {
        id: exist.id
      }
    });
  }

  // // save to metadata
  // metadata.saveSpec(data)

  return true;
}
exports.saveFeature = async data => {
  let product = await LG.findOne({
    where: {
        "id" : data.product_id
    },
  }).then((data) => {return data})

  if(product){
    let feature = data.feature != '' && data.feature != null && data.feature != undefined?data.feature:data.description != null && data.description != '' && data.description != undefined?data.description:null
    let description = feature == data.description?null:data.description

    if(feature != null){
      let exist = await Features.findOne({
        where: {
            product_id : data.product_id,
            feature : feature,
            type : data.type != undefined && data.type != '' && data.type != null?data.type:0
        },
      }).then((data) => {return data})
      
      let view_type = data.view_type
      if(data.view_type == undefined){
        if(data.video != undefined && data.video != null && data.video != ''){
          view_type = 'hero'
        }else if((description != undefined && description != null && description != '') || (data.image != undefined && data.image != null && data.image != '')){
          view_type = 'grid'
        }else{
          view_type = 'list'
        }
      }
  
      if(!exist){
        await Features.create({
          product_id : data.product_id,
          sku : product.sku,
          feature : feature,
          description : description != undefined?description:null,
          image : data.image != undefined?data.image:null,
          video : data.video != undefined?data.video:null,
          priority : data.priority != undefined?data.priority:null,
          type : data.type != undefined?data.type:0,
          view_type : data.type == 1?null:view_type
        });
      }else{
        await Features.update({image : data.image != undefined?data.image:null, video : data.video != undefined?data.video:null, description : description != undefined?description:null, view_type : view_type != undefined?view_type:'list'}, {
          where: {
            id: exist.id
          }
        });
      }
    }
  }

  // // save to metadata
  // metadata.saveFeat(data)

  return true;
}

exports.saveDoc = async data => {
  let product = await LG.findOne({
    where: {
      id: data.product_id
    }
  }).then((data) => {return data})

  if(product){
    let exist = await Images.findOne({
      where: {
        product_id: data.product_id,
        type: 1,
        role: data.role,
        url: data.url
      }
    }).then((data) => {return data})

    let doc_type = data.url.includes('.pdf') || data.url.includes('.zip') || data.url.includes('.doc') || data.url.includes('.DWG') || data.url.includes('.dwg')?1:data.content_length != '0 kb' && data.content_length != '0' && data.content_length != null && data.url.includes('.')?1:2

    if(!exist){
      await Images.create({
        product_id : data.product_id,
        sku : product.sku,
        type : 1,
        url : data.url,
        role : data.role,
        content_length : data.content_length,
        document_type : doc_type
      });
    }else{
      await Images.update({
        url : data.url,
        content_length : data.content_length,
        document_type : doc_type
      }, {
        where: {
          id: exist.id
        }
      });
    }
  }

  // // save to metadata
  // data.type = 1
  // metadata.saveAsset(data)

  return true;
}

let getConlen = async (url, errIdx) => {
  return new Promise(async (resolve, reject) => {
    try{
      let header = {
        "accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
        'Connection': 'keep-alive',
      }
      // console.log('get size of : '+url)
      const data = await axios.get(url, { headers : header });
      let content_length = parseInt(data.headers["content-length"])/1000
      content_length = parseInt(content_length.toString().split('.')[0]) < 999?content_length.toFixed().toString()+' kb':(parseInt(data.headers["content-length"])/1000000).toFixed(1).toString()+' mb'
      resolve(content_length)
    } catch(err) {
      if(err.statusCode != undefined && errIdx < 5){
        console.log('Error : '+err.statusCode+' - '+err.message+' - '+url)
        if(!err.message.includes("404") && !err.message.includes("500") && !err.message.includes("403") && !err.message.includes("ENOTFOUND") && !err.message.includes("ECONNREFUSED") && err.statusCode != 403 && err.statusCode != 404 && err.statusCode != 500){
           let content_length = await getConlen(url, errIdx++)
           resolve(content_length)
        }else{
          resolve(true)
        }
      }
      resolve(true)
    }
  })
}

exports.getConLen = async url => {
  return new Promise(async (resolve, reject) => {
    let content_length = await getConlen(url, 0)
    return resolve(content_length)
  })
}

exports.deleteFeat = async product => {
  return new Promise(async (resolve, reject) => {
    let id = product.id != undefined?product.id:product
    await Features.destroy({
      where: {
        product_id : id
      }
    })
    return resolve(true)
  })
}

exports.deleteColorRelated = async product => {
  return new Promise(async (resolve, reject) => {
    let id = product.id != undefined?product.id:product
    await RelatedColor.destroy({
      where: {
        product_id : id
      }
    })
    return resolve(true)
  })
}

exports.deleteReview = async id => {
  return new Promise(async (resolve, reject) => {
    await Reviews.destroy({
      where: {
        product_id : id
      }
    })
    return resolve(true)
  })
}

exports.deleteFilter = async product => {
  return new Promise(async (resolve, reject) => {
    try{
      let id = product.id != undefined?product.id:product
      await FilterProduct.destroy({
        where: {
          product_id : id,
          is_from_app : 0
        }
      })
      return resolve(true)
    } catch(err) {
      console.log(err)
    }
  })
}

exports.deleteSpec = async product => {
  return new Promise(async (resolve, reject) => {
    let id = product.id != undefined?product.id:product
    await Spec.destroy({
      where: {
        product_id : id
      }
    })
    return resolve(true)
  })
}

exports.deleteImg = async product => {
  return new Promise(async (resolve, reject) => {
    let id = product.id != undefined?product.id:product
    await Images.destroy({
      where: {
        product_id : id,
        type : 0
      }
    })
    return resolve(true)
  })
}

exports.deleteDoc = async (product) => {
  return new Promise(async (resolve, reject) => {
    let id = product.id != undefined?product.id:product
    await Images.destroy({
      where: {
        product_id : id,
        type : 1
      }
    })
    return resolve(true)
  })
}

exports.save = async data => {
  try{
    // await sequelize.sync();
    let sku = data.sku.replace(/[^a-zA-Z0-9]/g, "")
    let original_sku = data.original_sku
    let name = data.name.replace(' ('+sku+')', '').replace(' ('+original_sku+')', '')
    let setBrand = data.brand == 'profile'?'GE Profile':data.brand
    let brand = await Brand.findOne({
      where: {
          "name" : setBrand
      },

  }).then((data) => {return data})
  if(!brand){
    brand = await Brand.create({
      name: data.brand,
      slug: data.brand.toLowerCase().replace(/ /g, '-')
    }).then((data) => {return data});
  }

  name = name.replace(new RegExp(brand.name+'®', "i"), '').replace(new RegExp(brand.name+'™', "i"), '').replace(new RegExp(brand.name+',', "i"), '').replace('Café™', '').replace('Café', '').replace(new RegExp(brand.name+' '), '').replace(' ® ', '').replace(' ™ ', '').replace('®', '').replace('™', '').replace(' .', '0.').trim()
  name = name == '' || name == ' '?data.category:name

    let where = {
        "sku" : sku,
        brand_id : brand.id
    }
    // if(data.brand == 'Amana' || data.brand == 'Jennair' || data.brand == 'KitchenAid' || data.brand == 'Maytag' || data.brand == 'Whirlpool' || brand.id == '17' || brand.id == '49' || brand.id == '8' || brand.id == '29' || brand.id == '50' || brand.id == '56'){
    if(brand.id == '17' || brand.id == '49' || brand.id == '8' || brand.id == '29' || brand.id == '50' || brand.id == '56'){
      where = {
        "sku" : sku,
      }
    }
    
    // if(data.brand == 'Amana' || data.brand == 'Jennair' || data.brand == 'KitchenAid' || data.brand == 'Maytag' || data.brand == 'Whirlpool' || data.brand == 'GE' || data.brand == 'GE Profile' || data.brand == 'Monogram' || data.brand == 'Haier' || data.brand == 'Cafe' || data.brand == 'Hotpoint' || data.brand == 'RCA' || data.brand == 'Crosley'){
    //   if(data.brand == 'Cafe'){
    //     name = data.name.includes('Café') || data.name.includes('Cafe')?name:data.brand+' '+name 
    //   }else if(data.brand == 'GE Profile'){
    //     name = data.name.toLowerCase().includes('profile')?name:data.brand+' '+name.replace(' GE ', '')
    //   }else{
    //     name = data.name.toLowerCase().includes(data.brand.toLowerCase())?name:data.brand+' '+name
    //   }
    // }

    let exist = await LG.findOne({
        where: where
        
    }).then((data) => {return data})
    
    let upc = data.upc != undefined?data.upc:null

    if(!exist){
        
        let create = await LG.create({
          sku: sku,
          original_sku : original_sku,
          brand_id: brand.id,
          // name : name.includes(sku) || name.includes(original_sku)?name:name+' ('+sku+')',
          name : name,
          color : data.color,
          original_color : data.color,
          price: data.price,
          category : data.category,
          subcategory : data.subcategory,
          detail_category : data.detailcategory,
          link : data.product_link,
          upc : upc,
          manual_guides_link : data.manual_guides_link,
          spec_download_link : data.specScrape,
          energy_guide_download_link : data.energy_guide_download_link,
          compliance_link : data.compliance_link,
          detail_category_id : 0,
          created_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")
          // features : data.features
        }).then((data) => {return data});
        if(brand.have_price == 1){
          // History.create({
          //   sku: sku,
          //   product_id: create.id,
          //   name : data.name,
          //   price: data.price,
          //   brand_id : create.brand_id,
          //   brand_name : brand.name,
          //   is_new : 1,
          //   created_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")
            
          // })
        }
        
        
        // // save to metadata
        // data.status = create.status
        // await metadata.save(data)

        return create;
    }else if(brand.id == exist.brand_id){
      await LG.update({price : data.price, status : "Active", is_custom : '0', is_manual : '0', original_sku : original_sku, updated_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")}, {
        where: {
          id: exist.id
        }
      });
      Images.destroy({
        where: {
          product_id : exist.id,
          url : 'https://api.appliance.io/image/no-image.png'
        }
      })
      if(data.category != null){
        await LG.update({category : data.category, subcategory : data.subcategory, detail_category : data.detailcategory}, {
          where: {
            id: exist.id
          }
        });
      }
      if(data.product_link != null && data.product_link != '' && data.product_link != undefined){
        await LG.update({link: data.product_link}, {
          where: {
            id: exist.id
          }
        });
      }
      if(data.color != null && data.color != '' && data.color != undefined){
        await LG.update({original_color: data.color, color: data.color}, {
          where: {
            id: exist.id
          }
        });
        // if(exist.color == null || exist.color == ''){
        //   await LG.update({color: data.color}, {
        //     where: {
        //       id: exist.id
        //     }
        //   });
        // }
      }
      if(data.name != null && data.name != '' && data.name != undefined && data.name.length >= 25){
        // await LG.update({name: name.includes(sku) || name.includes(original_sku)?name:name+' ('+sku+')'}, {
        await LG.update({name: name}, {
          where: {
            id: exist.id
          }
        });
      }
      if(exist.upc == null && upc != null){
        await LG.update({upc: upc}, {
          where: {
            id: exist.id
          }
        });
      }
      if(brand.have_price == 1){
        // History.create({
        //   sku: sku,
        //   product_id: exist.id,
        //   name : data.name,
        //   price: data.price,
        //   brand_id : exist.brand_id,
        //   brand_name : brand.name,
        //   is_new : 1,
        //   created_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")
        // })
      }

      let latestProd = await LG.findOne({
        where: {
          id: exist.id
        }
      }).then((data) => {return data})

      // // save to metadata
      // data.status = latestProd.status
      // await metadata.save(data)

      return latestProd;
    }else if(brand.id == '17' || brand.id == '49' || brand.id == '8' || brand.id == '29' || brand.id == '50' || brand.id == '56'){
      await LG.update({price : data.price, status : "Active", is_custom : '0', is_manual : '0', original_sku : original_sku, updated_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")}, {
        where: {
          id: exist.id
        }
      });
      Images.destroy({
        where: {
          product_id : exist.id,
          url : 'https://api.appliance.io/image/no-image.png'
        }
      })
      if(data.color != null && data.color != '' && data.color != undefined){
        await LG.update({original_color: data.color}, {
          where: {
            id: exist.id
          }
        });
        if(exist.color == null){
          await LG.update({color: data.color}, {
            where: {
              id: exist.id
            }
          });
        }
      }
      if(exist.upc == null && upc != null){
        await LG.update({upc: upc}, {
          where: {
            id: exist.id
          }
        });
      }

      let latestProd = await LG.findOne({
        where: {
          id: exist.id
        }
      }).then((data) => {return data})

      // // save to metadata
      // data.status = latestProd.status
      // await metadata.save(data)

      return latestProd;
    }
    return false;
  } catch(err) {
    console.log(err)
  }
}

exports.saveManual = async data => {
  let original_sku = data.original_sku
  let brand = await Brand.findOne({
    where: {
        "name" : data.brand
    },

  }).then((data) => {return data})
  if(!brand){
      brand = await Brand.create({
          name : data.brand,
          slug : data.brand.toLowerCase().replace(/ /g, '-'),
          have_price : 0,
          created_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")
      }).then((data) => {return data});
  }
  
  let where = {
      "sku" : data.sku,
      brand_id : brand.id
  }
  let exist = await Manual.findOne({
      where: where
      
  }).then((data) => {return data})
  
  if(!exist){
      
      let create = await Manual.create({
        brand_id: brand.id,
        sku: data.sku,
        original_sku : original_sku,
        name : data.name,
        price: data.price,
        color : data.color,
        original_color : data.color,
        link : data.product_link,
        detail_category_id : data.detail_category_id,
        category : data.category,
        subcategory : data.subcategory,
        detail_category : data.detailcategory,
        v3_category : data.v3_category,
        v3_subcategory : data.v3_subcategory,
        v3_detail_category : data.v3_detail_category,
        ajmadison_categories : data.ajmadison_category,
        new_category : data.new_category,
        new_subcategory : data.new_subcategory,
        new_detail_category : data.new_detailcategory,
        manual_guides_link : data.manual_guides_link,
        spec_download_link : data.spec,
        energy_guide_download_link : data.energy,
        compliance_link : data.compliance,
        product_status : data.product_status,
        status : data.status,
        exist : data.exist,
        created_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")
        // features : data.features
      }).then((data) => {return data});
      if(brand.have_price == 1){
        // History.create({
        //   sku: data.sku,
        //   product_id: create.id,
        //   name : data.name,
        //   price: data.price,
        //   brand_id : create.brand_id,
        //   brand_name : brand.name,
        //   is_new : 1,
        //   created_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")
          
        // })
      }
      

      return create;
  }else{
    await Manual.update({ price : data.price, original_color : data.color, status : "Active", original_sku : original_sku, updated_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")}, {
      where: {
        id: exist.id
      }
    });
    if(brand.have_price == 1){
      // History.create({
      //   sku: data.sku,
      //   product_id: exist.id,
      //   name : data.name,
      //   price: data.price,
      //   brand_id : exist.brand_id,
      //   brand_name : brand.name,
      //   is_new : 1,
      //   created_at : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")
      // })
    }

    return exist;
  }
}

exports.saveImage = async data => {
  let product_ = await LG.findOne({
      where: {
          "sku" : data.sku
      },
  }).then((data) => {return data})
  let product = data.product_id != null && data.product_id != undefined?data.product_id:product_.id
  if(product){

    Images.destroy({
      where: {
          product_id : product,
          url : 'https://api.appliance.io/image/no-image.png'
      }
    })

    let exist = await Images.findOne({
      where: {
          "product_id" : product,
          "url" : data.image_link
      }
    }).then((data) => {return data})
    
    if(!exist){
      await Images.create({
          product_id : product,
          sku : data.sku,
          url : data.image_link
      });
    }
      
  }

  // // save to metadata
  // data.product_id = product
  // data.type = 0
  // metadata.saveAsset(data)

  return true;
}

exports.saveProgress = async (brand_slug, status) => {
  if(brand_slug == "frig" || brand_slug == "LG"){
    await Progress.update({
      status : status
    },{
      where: {
          brand_slug : {
            [Op.like]: '%'+brand_slug+'%'
          }
      },
      
  }).then((data) => {return data})
  }else{
      await Progress.update({
        status : status
      },{
        where: {
            brand_slug : brand_slug
        },
        
    }).then((data) => {return data})
  }
  pusher.trigger("product-scrape-progress", "ProductScrapeProgress", { data:{
      brand : brand_slug,
      status : status
  } })
  

  
}
exports.updateAll = async brand_name => {
  // await sequelize.sync();
  let brand = await Brand.findOne({
    where: {
        "name" : brand_name
    },
  }).then((data) => {return data})
  if(brand == null){
    brand = await Brand.create({
      name: brand_name,
      slug: brand_name.toLowerCase().replace(/ /g, '-')
    }).then((data) => {return data});
  }
  
  let datas = LG.findAll({
    where: {
      brand_id: brand.id.toString()
    }
  }).then((data) => {return data})
  let prev_datas = datas

    await LG.update({ status: 'Discontinued', }, {
        where: {
          brand_id : brand.id.toString()
        }
    });
    await LG.update({
      status : "Discontinued"
    },{
      where: {
          brand_id : brand.id.toString()
      }
    })

    await ScrapeResult.update({status : 2, total_scraped : 0, error : 0, last_scrape : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")}, {
      where: {
        brand_id: brand.id.toString()
      }
    });

    return prev_datas;
}


exports.saveResult = async (data, prev_datas) => {
  console.log('getting result..')

  let getLastDate = await LG.findAll({where:{brand_id: data, status: 'Active', updated_at: {[Op.not]: null,}}}).then((data) => {return data})
  let products = 0
  let products_active = 0
  let products_discontinued = 0
  let new_products = 0

  if(getLastDate.length > 0){
    getLastDate = moment(getLastDate[0].updated_at).format('YYYY-MM-DD')
    // let getLastDate = moment.tz(new Date(), 'Asia/Jakarta').format("YYYY-MM-DD")
  
    let _products = await Datas.findAll({
      where: {
        brand_id: data,
        [Op.or]: [
          { created_at: {
            [Op.gt]: getLastDate
          }, },
          { updated_at: {
            [Op.gt]: getLastDate
          }, }
        ]
      }
    }).then((data) => {return data})

    let _products_active = await Datas.findAll({
      where: {
        brand_id: data,
        status: 'Active'
      }
    }).then((data) => {return data})

    let _products_discontinued = await Datas.findAll({
      where: {
        brand_id: data,
        status: 'Discontinued'
      }
    }).then((data) => {return data})
    
    let _new_products = await Datas.findAll({
      where: {
        brand_id: data,
        created_at: {
          [Op.gt]: getLastDate
        }
      }
    }).then((data) => {return data})

    products = _products.length
    products_active = _products_active.length
    products_discontinued = _products_discontinued.length
    new_products = _new_products.length
  }
  
  await ScrapeResult.update({status : 1, total_scraped : products, total_active : products_active, total_discontinued : products_discontinued, new_products : new_products, last_scrape : moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00")}, {
    where: {
      brand_id: data
    }
  });

  // let exist_logs = await ScrapeLog.findAll({
  //   where: {
  //     brand_id: data
  //   }
  // }).then((data) => {return data})

  // for(e=0; e<exist_logs.length; e++){
  //   let new_order = exist_logs[e].scrape_order += 1
    
  //   if(new_order == 6){
  //     await ScrapeLog.destroy({
  //       where: {
  //         id : exist_logs[e].id
  //       }
  //     })
  //   }else{
  //     await ScrapeLog.update({scrape_order: new_order}, {
  //       where: {
  //         id: exist_logs[e].id
  //       }
  //     });
  //   }
  // }

  let total_changed_status = 0
  for(d=0; d<prev_datas.length; d++){
    let current_data = await LG.findOne({
      where: {
        id: prev_datas[d].id,
        brand_id: prev_datas[d].brand_id,
        sku: prev_datas[d].sku
      }
    }).then((data) => {return data})
    
    if(prev_datas[d].status != current_data.status){
      total_changed_status+=1
      
      let brand = await Brand.findByPk(current_data.brand_id).then((data) => {return data})

      await StatusLog.create({
        product_id: current_data.id,
        brand: brand.name,
        sku: current_data.sku,
        old_status: prev_datas[d].status,
        status: current_data.status,
        created_at: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD")
      });
    }
  }

  // let total = await LG.count({ where: {brand_id: data} }).then((data) => {return data})
  // let total_active = await LG.count({ where: {brand_id: data, status: 'Active' }}).then((data) => {return data})
  // let total_discontinued = await LG.count({ where: {brand_id: data, status: 'Discontinued' }}).then((data) => {return data})
  // let total_custom = await LG.count({ where: {brand_id: data, is_custom: 1 }}).then((data) => {return data})
  // let total_duplicate = await sequelize.query("SELECT *, count(*) FROM `v4_product_datas` WHERE `brand_id` = "+data+" GROUP BY sku HAVING COUNT(*) > 1", { type: QueryTypes.SELECT }).then((data) => {return data})

  // await ScrapeLog.create({
  //   brand_id: data,
  //   total: total,
  //   total_active: total_active,
  //   total_discontinued: total_discontinued,
  //   total_duplicate: total_duplicate.length,
  //   total_custom: total_custom,
  //   total_changed_status: total_changed_status,
  //   date: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00"),
  //   scrape_order: 1,
  // })

  console.log('getting result success.')
  return true;
}

exports.updateDataPerBrand = async brand_id => {
  try{
    let total = await LG.count({ where: {brand_id: brand_id} }).then((data) => {return data})
    let total_active = await LG.count({ where: {brand_id: brand_id, status: 'Active' }}).then((data) => {return data})
    let total_discontinued = await LG.count({ where: {brand_id: brand_id, status: 'Discontinued' }}).then((data) => {return data})
    let total_custom = await LG.count({ where: {brand_id: brand_id, is_custom: 1 }}).then((data) => {return data})
    // let total_duplicate = await sequelize.query("SELECT *, count(*) FROM `v4_product_datas` WHERE `brand_id` = "+brand_id+" GROUP BY sku HAVING COUNT(*) > 1", { type: QueryTypes.SELECT }).then((data) => {return data})
    let total_duplicate = 0
    
    let exist = await ScrapeLog.findOne({
      where: {
        brand_id: brand_id,
        scrape_order: 1
      }
    }).then((data) => {return data})
  
    if(!exist){
      await ScrapeLog.create({
        brand_id: brand_id,
        total: total,
        total_active: total_active,
        total_discontinued: total_discontinued,
        total_duplicate: total_duplicate.length,
        total_custom: total_custom,
        date: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00"),
        scrape_order: 1,
      })
    }else{
      await ScrapeLog.update({total: total, total_active: total_active, total_discontinued: total_discontinued, total_duplicate: total_duplicate.length, total_custom: total_custom}, {
        where: {
          brand_id: brand_id,
          scrape_order: 1
        }
      });
    }
  
    let have_no_category = await sequelize.query("SELECT * FROM `v4_product_datas` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_datas_category)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_color_relation = await sequelize.query("SELECT * FROM `v4_product_datas` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_color_related_products) AND id IN (SELECT product_related_id FROM v4_color_related_products)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_filter = await sequelize.query("SELECT * FROM `v4_product_datas` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_datas_filters)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_name = await LG.count({ where: {brand_id: brand_id, [Op.or]: [{ name: null }, { name: '' }] }}).then((data) => {return data})
    let have_no_color = await LG.count({ where: {brand_id: brand_id, color: null }}).then((data) => {return data})
    let have_no_images = await sequelize.query("SELECT * FROM `v4_product_datas` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_assets WHERE type = 0)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_features = await sequelize.query("SELECT * FROM `v4_product_datas` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_main_features)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_docs = await sequelize.query("SELECT * FROM `v4_product_datas` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_assets WHERE type = 1)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_specs = await sequelize.query("SELECT * FROM `v4_product_datas` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_specs)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_upc = await LG.count({ where: {brand_id: brand_id, upc: null }}).then((data) => {return data})
    
    let dataAll = [have_no_category.length, have_no_color_relation.length, have_no_filter.length, have_no_name, have_no_color, have_no_images.length, have_no_features.length, have_no_docs.length, have_no_specs.length, have_no_upc]
    let sum = 0
    for(a=0; a<dataAll.length; a++){
      sum += dataAll[a]
    }
  
    let completeness = (((total*10)-sum)/(total*10))*100
    // (total have_no_.. / (total product*10)) * 100
    completeness = completeness.toFixed(1)+'%'
    
    await DataCompleteness.update({
      total_product: total,
      total_active: total_active, 
      total_discontinued: total_discontinued, 
      total_custom: total_custom, 
      total_duplicate: 0, 
      have_no_category: have_no_category.length,
      have_no_color_relation: have_no_color_relation.length,
      have_no_filter: have_no_filter.length,
      have_no_name: have_no_name,
      have_no_color: have_no_color,
      have_no_images: have_no_images.length,
      have_no_features: have_no_features.length,
      have_no_docs: have_no_docs.length,
      have_no_specs: have_no_specs.length,
      have_no_upc: have_no_upc,
      updated_at: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00"),
      completeness: completeness
    }, {
      where: {
        brand_id: brand_id
      }
    });
  
    // ============================================================================= for live product ============================================================================= //
    let total_live = await BaseProduct.count({ where: {brand_id: brand_id} }).then((data) => {return data})
    let total_active_live = await BaseProduct.count({ where: {brand_id: brand_id, status: 'Active' }}).then((data) => {return data})
    let total_discontinued_live = await BaseProduct.count({ where: {brand_id: brand_id, status: 'Discontinued' }}).then((data) => {return data})
    let total_custom_live = await BaseProduct.count({ where: {brand_id: brand_id, is_custom: 1 }}).then((data) => {return data})
    // let total_duplicate_live = await sequelize.query("SELECT *, count(*) FROM `v4_base_product` WHERE `brand_id` = "+brand_id+" GROUP BY 'key' HAVING COUNT(*) > 1", { type: QueryTypes.SELECT }).then((data) => {return data})
    let total_duplicate_live = 0
  
    let have_no_category_live = await sequelize.query("SELECT * FROM `v4_base_product` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_base_product_category)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_color_relation_live = await sequelize.query("SELECT * FROM `v4_base_product` WHERE `brand_id` LIKE '"+brand_id+"' AND scrape_id NOT IN (SELECT product_id FROM v4_color_related_products) AND id IN (SELECT product_related_id FROM v4_color_related_products)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_filter_live = await sequelize.query("SELECT * FROM `v4_base_product` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_sort)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_name_live = await sequelize.query("SELECT v4_product_data.*, v4_base_product.* FROM `v4_product_data`, v4_base_product WHERE v4_base_product.id = v4_product_data.product_id AND v4_base_product.brand_id = "+brand_id+" AND (v4_product_data.basic_description IS NULL OR v4_product_data.basic_description LIKE '' OR v4_product_data.basic_description LIKE ' ')", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_color_live = await sequelize.query("SELECT v4_product_data.*, v4_base_product.* FROM `v4_product_data`, v4_base_product WHERE v4_base_product.id = v4_product_data.product_id AND v4_base_product.brand_id = "+brand_id+" AND (v4_product_data.color IS NULL)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_images_live = await sequelize.query("SELECT * FROM `v4_base_product` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_asset WHERE type = 0)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_features_live = await sequelize.query("SELECT * FROM `v4_base_product` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_main_feature)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_docs_live = await sequelize.query("SELECT * FROM `v4_base_product` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_asset WHERE type = 1)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_specs_live = await sequelize.query("SELECT * FROM `v4_base_product` WHERE `brand_id` LIKE '"+brand_id+"' AND id NOT IN (SELECT product_id FROM v4_product_feature)", { type: QueryTypes.SELECT }).then((data) => {return data})
    let have_no_upc_live = await sequelize.query("SELECT v4_product_datas.*, v4_base_product.* FROM `v4_product_datas`, v4_base_product WHERE v4_base_product.scrape_id = v4_product_datas.id AND v4_base_product.brand_id = "+brand_id+" AND (v4_product_datas.upc IS NULL)", { type: QueryTypes.SELECT }).then((data) => {return data})
    
    let dataAll_live = [have_no_category_live.length, have_no_color_relation_live.length, have_no_filter_live.length, have_no_name_live.length, have_no_color_live.length, have_no_images_live.length, have_no_features_live.length, have_no_docs_live.length, have_no_specs_live.length, have_no_upc_live.length]
    let sum_live = 0
    for(l=0; l<dataAll_live.length; l++){
      sum_live += dataAll_live[l]
    }
  
    let completeness_live = (((total_live*10)-sum_live)/(total_live*10))*100
    // (total have_no_.. / (total product*10)) * 100
    completeness_live = completeness_live.toFixed(1)+'%'
    
    await DataCompletenessLive.update({
      total_product: total_live,
      total_active: total_active_live, 
      total_discontinued: total_discontinued_live, 
      total_custom: total_custom_live, 
      total_duplicate: 0, 
      have_no_category: have_no_category_live.length,
      have_no_color_relation: have_no_color_relation_live.length,
      have_no_filter: have_no_filter_live.length,
      have_no_name: have_no_name_live.length,
      have_no_color: have_no_color_live.length,
      have_no_images: have_no_images_live.length,
      have_no_features: have_no_features_live.length,
      have_no_docs: have_no_docs_live.length,
      have_no_specs: have_no_specs_live.length,
      have_no_upc: have_no_upc_live.length,
      updated_at: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD H:00:00"),
      completeness: completeness_live
    }, {
      where: {
        brand_id: brand_id
      }
    });
  
    return true
  } catch(err) {
    console.log(err)
  }
}

exports.insertFilter = async data => {
  if(data.category != null && data.subcategory != null){
    let category = await Category.findOne({
        where: {
            name: {
                [Op.substring]: data.category
            },
        }
    }).then((data) => {return data})
  
    let subcategory = await SubCategory.findOne({
        where: {
            name: {
                [Op.substring]: data.subcategory
            },
            category_id: category.id
        }
    }).then((data) => {return data})
  
    let exist = await FilterProduct.findOne({
      where: {
        product_id: data.product_id,
        field: data.field,
        value: data.value
      }
    }).then((data) => {return data})
  
    if(!exist){
      await FilterProduct.create({
          product_id: data.product_id,
          subcategory_id: subcategory.id,
          section: data.section,
          field: data.field,
          value: data.value
      });
    }
  }
}

exports.saveDetCat = async data => {
  console.log(data.product_id+' - '+data.sku)
  let category = await Category.findOne({
      where: {
          name: {
              [Op.substring]: data.new_category
          },
      }
  }).then((data) => {return data})

  if(category){
    let subcategory = await SubCategory.findOne({
        where: {
            name: {
                [Op.substring]: data.new_subcategory
            },
            category_id: category.id
        }
    }).then((data) => {return data})
    if(subcategory == null){
      console.log(data)
    }
    let detail_category = await DetailCategory.findOne({
        where: {
            name: {
                [Op.substring]: data.new_detail_category
              },
            subcategory_id: subcategory.id
        }
    }).then((data) => {return data})
    let detail_category_back = await DetailCategory.findOne({
      where: {
          slug: {
              [Op.substring]: data.new_detail_category.replace(/ /g, '-').replace(/&/g, '-').replace('---', '-')
            },
          subcategory_id: subcategory.id
      }
    }).then((data) => {return data})

    detail_category = detail_category == null?detail_category_back:detail_category

    // if(detail_category == null && data.new_subcategory == 'Ranges'){
    //   return true;
    // }else if(detail_category == null && data.new_subcategory != 'Ranges'){
    //   return data.product_id;
    // }

    let exist = await DatasDetail.findOne({
        where: {
            product_id: data.product_id,
            // detail_category_id: detail_category.id
        }
    }).then((data) => {return data})

    let catexist = await Datas.findOne({
        where: {
            id: data.product_id
        }
    }).then((data) => {return data})

    // if(catexist.new_detail_category == null){
    if(detail_category != undefined && detail_category != null){
      await Datas.update({ new_category : data.new_category, new_subcategory : data.new_subcategory, new_detail_category : data.new_detail_category, detail_category_id : detail_category.id}, {
          where: {
              id: data.product_id
          }
      });
      if(!exist){
        await DatasDetail.create({
            product_id: data.product_id,
            detail_category_id: detail_category.id,
            status: data.default_category
        });
      }else{
        if(detail_category != undefined && detail_category != null){
          await DatasDetail.update({detail_category_id : detail_category.id}, {
            where: {
              id: exist.id
            }
          });
        }
      }

      let product = await Datas.findByPk(data.product_id).then((data) => {return data})
      if((data.new_detail_category.includes('Part') || data.new_detail_category.includes('Accessories') || data.new_detail_category == 'Other' || data.new_detail_category == 'Insert') && (product.original_color == null || product.color == null)){
        await Datas.update({original_color: 'Other', color: 'Other'}, {
          where: {
            id: data.product_id
          }
        })
      }
    }
  }
  

  return true;
}

exports.deleteModel = async id => {
  let product = await LG.findOne({
    where: {
      id: id
    }
  }).then((data) => {return data})

  await Images.destroy({
    where: {
      product_id : id,
      sku : product.sku
    }
  })
  await Features.destroy({
    where: {
      product_id : id,
      sku : product.sku
    }
  })
  await Spec.destroy({
    where: {
      product_id : id
    }
  })
  await RelatedColor.destroy({
    where: {
      product_id : id
    }
  })
  await RelatedColor.destroy({
    where: {
      product_related_id : id
    }
  })
  await DatasDetail.destroy({
    where: {
      product_id : id
    }
  })
  await FilterProduct.destroy({
    where: {
      product_id : id
    }
  })
  await LG.destroy({
    where: {
      id : id
    }
  })

  return product;
}

exports.logStart = async brand => {
  let datas = await sequelize.query("SELECT v4_product_datas.id as product_id, v4_product_brands.name as brand, v4_product_datas.sku, v4_product_datas.status FROM `v4_product_datas`, v4_product_brands WHERE v4_product_brands.id = v4_product_datas.brand_id AND v4_product_brands.name LIKE '"+brand+"' AND v4_product_datas.`link` IS NOT NULL", 
  { type: QueryTypes.SELECT }).then((data) => {return data})
  console.log('log status started - '+datas.length+' products')

  for(d=0; d<datas.length; d++){
    let exist = await StatusLog.findOne({
      where: {
        product_id: datas[d].product_id,
        brand: datas[d].brand,
        sku: datas[d].sku,
        created_at: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD")
      }
    }).then((data) => {return data})
    
    if(!exist && datas[d] != undefined){
      await StatusLog.create({
        product_id: datas[d].product_id,
        brand: datas[d].brand,
        sku: datas[d].sku,
        old_status: datas[d].status,
        created_at: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD")
      });
    }
  }
}

exports.logEnd = async brand => {
  let datas = await sequelize.query("SELECT v4_product_datas.id as product_id, v4_product_brands.name as brand, v4_product_datas.sku, v4_product_datas.status FROM `v4_product_datas`, v4_product_brands WHERE v4_product_brands.id = v4_product_datas.brand_id AND v4_product_brands.name LIKE '"+brand+"' AND v4_product_datas.`link` IS NOT NULL", 
  { type: QueryTypes.SELECT }).then((data) => {return data})

  for(d=0; d<datas.length; d++){
    await StatusLog.update({
      status : datas[d].status
    }, {
      where: {
        product_id: datas[d].product_id,
        brand: datas[d].brand,
        sku: datas[d].sku,
        created_at: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD")
      }
    });
  }
}

// FOR DELETING DUPLICATE
let deleteModel_ = async id => {
  return new Promise(async (resolve, reject) => {
    let product = await LG.findOne({
      where: {
        id: id
      }
    }).then((data) => {return data})
  
    await Images.destroy({
      where: {
        product_id : id,
        sku : product.sku
      }
    })
    await Features.destroy({
      where: {
        product_id : id,
        sku : product.sku
      }
    })
    await Spec.destroy({
      where: {
        product_id : id
      }
    })
    await RelatedColor.destroy({
      where: {
        product_id : id
      }
    })
    await RelatedColor.destroy({
      where: {
        product_related_id : id
      }
    })
    await DatasDetail.destroy({
      where: {
        product_id : id
      }
    })
    await FilterProduct.destroy({
      where: {
        product_id : id
      }
    })
    await LG.destroy({
      where: {
        id : id
      }
    })
  
    resolve(product);
  })
}

exports.deleteDuplicate = async (req, res) => {
  res.json("processing..")
  // let datas = await sequelize.query("SELECT v4_product_datas.id, v4_product_datas.brand_id, v4_product_datas.sku, v4_product_datas.detail_category_id, v4_product_datas.new_category, v4_product_datas.new_subcategory, v4_product_datas.new_detail_category, v4_product_datas.status, COUNT(*) as total FROM `v4_product_datas` GROUP BY sku, brand_id HAVING COUNT(*) > 1", 
  let datas = await sequelize.query('SELECT REPLACE(sku, "-", "") as sku, original_sku, brand_id, COUNT(*) as total FROM `v4_product_datas` GROUP BY REPLACE(sku, "-", ""), brand_id HAVING COUNT(*) > 1', 
  { type: QueryTypes.SELECT }).then((data) => {return data})

  for(d=0; d<datas.length; d++){
    console.log(datas[d].sku)
    let products = await LG.findAll({
      where: {
        brand_id: datas[d].brand_id,
        // sku: datas[d].sku
        original_sku: datas[d].original_sku
      },
      order: [
        ['updated_at', 'DESC'],
        ['id', 'ASC']
      ],
    }).then((data) => {return data})

    products.shift();
    
    for(p=0; p<products.length; p++){
      await deleteModel_(products[p].id)
    }
  }
}

exports.deleteDuplicateGE = async (req, res) => {
  // res.json("processing..")
  let query = ''
  if(req == 'GE'){
    query = "SELECT v4_product_datas.id, v4_product_datas.brand_id, v4_product_datas.sku, v4_product_datas.detail_category_id, v4_product_datas.new_category, v4_product_datas.new_subcategory, v4_product_datas.new_detail_category, v4_product_datas.status, COUNT(*) as total FROM `v4_product_datas` WHERE (`brand_id` LIKE '17' OR `brand_id` LIKE '8' OR `brand_id` LIKE '50' OR `brand_id` LIKE '49' OR `brand_id` LIKE '19' OR `brand_id` LIKE '29') GROUP BY sku HAVING COUNT(*) > 1"
  }else{
    query = "SELECT v4_product_datas.id, v4_product_datas.brand_id, v4_product_datas.sku, v4_product_datas.detail_category_id, v4_product_datas.new_category, v4_product_datas.new_subcategory, v4_product_datas.new_detail_category, v4_product_datas.status, COUNT(*) as total FROM `v4_product_datas` WHERE (`brand_id` LIKE '22' OR `brand_id` LIKE '23' OR `brand_id` LIKE '24') GROUP BY sku HAVING COUNT(*) > 1"
  }
  let datas = await sequelize.query(query, { type: QueryTypes.SELECT }).then((data) => {return data})

  for(d=0; d<datas.length; d++){
    console.log(datas[d].sku)
    let products = await LG.findAll({
      where: {
        sku: datas[d].sku
      },
      order: [
        ['updated_at', 'DESC'],
        ['id', 'ASC']
      ],
    }).then((data) => {return data})

    products.shift();
    
    for(p=0; p<products.length; p++){
      await deleteModel_(products[p].id)
    }
  }
}

exports.saveError = async (data) => {
  let error = JSON.stringify(data.error_detail, ["name", "message", "code", "arguments", "type", 'stack', 'address'])

  if(!data.message.includes('tunneling socket') && !data.message.includes('network socket') && !data.message.includes('500')){
    let exist = await ErrorsLog.findOne({
      where: {
        file: data.file,
        message: data.message,
        error_detail: error
      }
    }).then((data) => {return data})
  
    if(!exist){
      await ErrorsLog.create({
        file: data.file,
        brand_id: data.brand_id,
        message: data.message,
        error_detail: error,
        solved: 0,
        created_at: moment.tz(new Date(), 'America/Chicago').format("YYYY-MM-DD"),
        solved_at: null
      });
    }else{
      let total = exist.total_error += 1;
      await ErrorsLog.update({total_error : total, solved: 0, solved_at: null}, {
        where: {
          id: exist.id
        }
      });
    }
  
    if(data.brand_id != undefined){
      await ScrapeResult.update({status : 0, error : 1}, {
        where: {
          brand_id: data.brand_id
        }
      });
    }
  }
  
  return true;
}

exports.featureDuplicate = async features => {
  let newFeature = uniq(features, (a, b) => { return a.Feature == b.Feature && a.description == b.description && a.image == b.image && a.video == b.video })
  return newFeature;
}

module.exports.Datas = Datas
module.exports.LG = LG
module.exports.History = History
module.exports.Brand = Brand
module.exports.Spec = Spec
module.exports.Features = Features
module.exports.Images = Images
module.exports.Manual = Manual
module.exports.DatasDetail = DatasDetail
module.exports.Category = Category
module.exports.SubCategory = SubCategory
module.exports.DetailCategory = DetailCategory
module.exports.RelatedColor = RelatedColor
module.exports.FilterProduct = FilterProduct
module.exports.StatusLog = StatusLog
module.exports.ErrorsLog = ErrorsLog
module.exports.ScrapeResult = ScrapeResult
module.exports.Scrapelog = ScrapeLog
module.exports.DataCompleteness = DataCompleteness
module.exports.DataDetailCompleteness = DataDetailCompleteness
module.exports.FilterAppConn = FilterAppConn
module.exports.Reviews = Reviews
module.exports.Cookie = Cookie
module.exports.sequelize = sequelize