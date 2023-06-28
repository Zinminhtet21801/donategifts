const moment = require('moment');
const BaseController = require('./basecontroller');
const PostRepository = require('../db/repository/PostRepository');
const AgencyRepository = require('../db/repository/AgencyRepository');

module.exports = class CommunityController extends BaseController {
	#postRepository;

	#agencyRepository;

	constructor() {
		super();
		this.#postRepository = new PostRepository();
		this.#agencyRepository = new AgencyRepository();

		this.handleGetIndex = this.handleGetIndex.bind(this);
		this.handlePostIndex = this.handlePostIndex.bind(this);
	}

	async handleGetIndex(req, res, _next) {
		try {
			const posts = (await this.#postRepository.getAllPosts()).sort(
				(a, b) => a.createdAt - b.createdAt,
			);
			this.renderView(res, 'pages/community', { posts, moment });
		} catch (error) {
			return this.handleError({ res, code: 400, error });
		}
	}

	async handlePostIndex(req, res, _next) {
		try {
			const { user } = req.session;

			if (!user) {
				return this.handleError({
					res,
					code: 401,
					error: 'You must be logged in to make a post!',
				});
			}

			const agency = await this.#agencyRepository.getAgencyByUserId(user._id);

			let profileImage;

			if (req.file !== undefined) {
				let filePath;
				if (process.env.NODE_ENV === 'development') {
					// locally when using multer images are saved inside this folder
					filePath = `/uploads/${req.file.filename}`;
				}
				profileImage = process.env.USE_AWS === 'true' ? req.file.Location : filePath;
			}

			const newPost = {
				message: req.body.message,
				image: profileImage || null,
				belongsTo: agency,
			};

			await this.#postRepository.createNewPost(newPost);

			const posts = (await this.#postRepository.getAllPosts()).sort(
				(a, b) => a.createdAt - b.createdAt,
			);

			res.status(200).send({
				posts,
			});
		} catch (error) {
			return this.handleError({ res, code: 400, error });
		}
	}
};
