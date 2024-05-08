const express = require("express");
const controllers = require("../controllers");
const router = express.Router();

// router
//   .route("/member")
//   .get(middleware.authorize, controllers.getAllMembers)
//   .post(middleware.authorize, controllers.createMember);
// router
//   .route("/member/:personnummer")
//   .get(controllers.getMember)
//   .put(middleware.authorize, controllers.updateMember)
//   .delete(middleware.authorize, controllers.deleteMember);

router.route("/products/female").get(controllers.getProductsFemale);
router.route("/products/male").get(controllers.getProductsMale);
router.route("/products/best-sellers/:amount").get(controllers.getBestSellers);

router.route("/product/color/:id").get(controllers.getProductColor);
router.route("/product/:id/colors").get(controllers.getProductColors);

module.exports = router;
