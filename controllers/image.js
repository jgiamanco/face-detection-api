const Clarifai = require('clarifai');
const app = new Clarifai.App({
   apiKey: process.env.API_CLARIFAI
});

const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = (req, file, cb) => {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter})


const cloudinary = require("cloudinary");
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const handleImageUpload = () => (req, res) => {
	console.log(req.files);
	const values = Object.values(req.files);
  const promises = values.map(image => cloudinary.uploader.upload(image.path));
  
  Promise
    .all(promises)
    .then(results => res.json(results));
}

const escapeRegex = (text) => {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const handleApiCall = () => (req, res) => {
	app.models.predict("a403429f2ddf4b49b307e318f00e528b", req.body.input)
	.then(data => {
		res.json(data);
	})
	.catch(err => res.status(400).json(-1));
}


const handleImage = (db) => (req, res) => {
	const {id} = req.body;

	db("users")
		.where("id", "=", id)
		.increment("entries", 1)
		.returning("entries")
	.then( entries => {
		if(entries.length){
			res.json(entries);
		} else {
			res.status(400).json("unable to get entries of user with id = " + id);
		}
	})
	.catch( err => res.status(400).json("unable to get entries"));
}

module.exports = {handleImage, handleApiCall, handleImageUpload}