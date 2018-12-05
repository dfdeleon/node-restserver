const express = require('express');
const { verificaToken } = require('../middlewares/autenticacion');
const _ = require('underscore');
let app = express();
let Producto = require('../models/producto');


// ============================
// Obtener todos los productos
// ============================
app.get('/producto', verificaToken, (req, res) => {
    // Traer todos los productos
    // populate; usuario categoria
    // paginado

    let desde = req.query.desde || 0;
    desde = Number(desde);

    Producto.find({ disponible: true }) //<-- Exclusión de campos a mostrar
        .populate('usuario', 'nombre email')
        .populate('categoria', 'descripcion')
        .skip(desde)
        .limit(5)
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            };
            res.json({
                ok: true,
                productos
            });

        });
});

// ============================
//  Obtener un producto por ID 
// ============================
app.get('/producto/:id', verificaToken, (req, res) => {
    // populate; usuario categoria
    let id = req.params.id;

    Producto.findById(id)
        .populate('usuario', 'nombre')
        .populate('categoria', 'descripcion')
        .exec((err, productoDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            };
            if (!productoDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El id no es correcto'
                    }
                });
            };

            res.json({
                ok: true,
                producto: productoDB
            });

        });


});

// ============================
//        Buscar producto
// ============================
app.get('/producto/buscar/:termino', verificaToken, (req, res) => {

    let termino = req.params.termino;

    let regex = new RegExp(termino, 'i');

    Producto.find({ nombre: regex })
        .populate('categoria', 'descripcion')
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                productos
            });
        });
});

// ============================
//    Crear un nuevo producto
// ============================
app.post('/producto', verificaToken, (req, res) => {
    // grabar el usuario
    // grabar una categoria del listado

    let body = req.body;

    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        disponible: body.disponible,
        categoria: body.categoria,
        usuario: req.usuario._id
    });

    producto.save((err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        res.status(201).json({
            ok: true,
            producto: productoDB
        });

    });
});

// ============================
// Actualizar un nuevo producto
// ============================
app.put('/producto/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['nombre', 'precioUni', 'categoria', 'descripcion', 'disponible']);

    Producto.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El ID no existe'
                }
            });
        }

        res.json({
            ok: true,
            producto: productoDB
        });

    });


});

// ============================
//      Borrar un producto
// ============================
app.delete('/producto/:id', verificaToken, (req, res) => {
    // cambiar el estatus de disponible 
    let id = req.params.id;

    let cambiaEstado = {
        disponible: false
    }

    Producto.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, productoDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        };

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no encontrado'
                }
            });
        };

        res.json({
            ok: true,
            producto: productoDB,
            message: 'Producto borrado'
        });
    });

});

module.exports = app;