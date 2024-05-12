const AppError = require("../utils/appError");
const conn = require("../services/db");

/*
exports.getProduct = (req, res, next) => {
  conn.query(
    `SELECT
      p.name,
      p.brand,
      p.sex,
      p.category,
      p.material,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', pc.id,
          'color', pc.color,
          'price', pc.price,
          'discount', pc.discount,
          'sizes', sizes.sizes
        )
      ) AS colors
    FROM
      product p
    JOIN
      product_color pc ON p.id = pc.product_id
    JOIN (
        SELECT 
            pc.id AS color_id,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'size', ps.size,
                    'quantity', ps.quantity
                )
            ) AS sizes
        FROM 
            product_color pc
        JOIN 
            product_size ps ON pc.id = ps.color_id
        GROUP BY 
            pc.id
    ) AS sizes ON pc.id = sizes.color_id
    WHERE
      p.id = ?
    GROUP BY
      p.id;`,
    [req.params.id],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data[0],
      });
    }
  );
};
*/

exports.getProductColor = (req, res, next) => {
  conn.query(
    `SELECT
      p.id AS product_id,
      p.name,
      p.brand,
      p.sex,
      p.category,
      p.material,
      pc.price,
      pc.discount,
      pc.images,
      JSON_ARRAYAGG(
        JSON_OBJECT(
            'size', ps.size,
            'quantity', ps.quantity
        )
      ) AS sizes
    FROM
      product_color pc
    JOIN
      product p ON pc.product_id = p.id
    JOIN
      product_size ps ON pc.id = ps.color_id
    WHERE
      pc.id = ?
    GROUP BY
      p.id;`,
    [req.params.id],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data[0],
      });
    }
  );
};
exports.getProductColors = (req, res, next) => {
  conn.query(
    `SELECT
      pc.id,
      pc.color
    FROM
      product_color pc
    WHERE
      pc.product_id = ?;`,
    [req.params.id],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

exports.getProductsSex = (req, res, next) => {
  conn.query(
    `SELECT
      pc.id,
      p.name,
      pc.price,
      pc.discount
    FROM
      product_color pc
    JOIN
      product p ON pc.product_id = p.id
    WHERE p.sex = ? OR p.sex = 'unisex';`,
    [req.params.sex],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

exports.getProductsSexCategories = (req, res, next) => {
  const categories = req.params.categories.split("~");

  conn.query(
    `SELECT
      pc.id,
      p.name,
      pc.price,
      pc.discount
    FROM
      product_color pc
    JOIN
      product p ON pc.product_id = p.id
    WHERE (p.sex = ? OR p.sex = 'unisex') AND p.category IN (?);`,
    [req.params.sex, categories],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

exports.getBestSellers = (req, res, next) => {
  conn.query(
    `SELECT
      pc.id,
      p.name,
      pc.price,
      pc.discount
    FROM
      product_color pc
    JOIN
      product p ON pc.product_id = p.id
    LIMIT ${req.params.amount};`,
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

/*
exports.getAllMembers = (req, res, next) => {
  conn.query("SELECT * FROM member", function (err, data, fields) {
    if (err) return next(new AppError(err));
    res.status(200).json({
      status: "success",
      length: data?.length,
      data: data,
    });
  });
};

exports.getMember = (req, res, next) => {
  const personNumRes = isPersonNumValid(req.params.personnummer);
  if (personNumRes !== true) {
    return next(new AppError(personNumRes, 400));
  }

  conn.query(
    "SELECT * FROM member WHERE personnummer = ?",
    [req.params.personnummer],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));
      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

exports.createMember = (req, res, next) => {
  if (!req.body) return next(new AppError("No form data found", 404));
  const personNumRes = isPersonNumValid(req.body.personnummer);
  if (personNumRes !== true) {
    return next(new AppError(personNumRes, 400));
  }
  const namesRes = isNamesValid(req.body.first_name, req.body.last_name);
  if (namesRes !== true) {
    return next(new AppError(namesRes, 400));
  }

  conn.query(
    "INSERT INTO member (personnummer, first_name, last_name, end_date) VALUES(?, ?, ?, ?)",
    [
      req.body.personnummer,
      req.body.first_name,
      req.body.last_name,
      req.body.end_date,
    ],
    function (err, data, fields) {
      if (err) {
        if (err.sqlMessage?.includes("Duplicate entry")) {
          return next(new AppError("Personnummret är redan medlem.", 409));
        }
        return next(new AppError(err, 500));
      }

      uploadMemberlist();

      res.status(201).json({
        status: "success",
        message: "member created!",
      });
    }
  );
};

exports.updateMember = (req, res, next) => {
  if (!req.params.personnummer) {
    return next(new AppError("No member personnummer found", 404));
  }
  const namesRes = isNamesValid(req.body.first_name, req.body.last_name);
  if (namesRes !== true) {
    return next(new AppError(namesRes, 400));
  }

  conn.query(
    "UPDATE member SET first_name=?, last_name=?, end_date=? WHERE personnummer=?",
    [
      req.body.first_name,
      req.body.last_name,
      req.body.end_date,
      req.params.personnummer,
    ],
    function (err, data, fields) {
      if (err) {
        if (err.sqlMessage?.includes("Duplicate entry")) {
          return next(new AppError("Personnummret är redan medlem.", 409));
        }
        return next(new AppError(err, 500));
      }

      uploadMemberlist();

      res.status(201).json({
        status: "success",
        message: "member updated!",
      });
    }
  );
};

exports.deleteMember = (req, res, next) => {
  if (!req.params.personnummer) {
    return next(new AppError("No member personnummer found", 404));
  }
  conn.query(
    "DELETE FROM member WHERE personnummer=?",
    [req.params.personnummer],
    function (err, fields) {
      if (err) return next(new AppError(err, 500));

      uploadMemberlist();

      res.status(204).json({
        status: "success",
        message: "member deleted!",
      });
    }
  );
};
*/
