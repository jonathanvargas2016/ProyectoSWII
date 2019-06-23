
CODIGO_TECLA = {
    32: 'espacio',
    37: 'izquierda',
    38: 'arriba',
    39: 'derecha',
    40: 'abajo',
    80: 'pausa'
}

ESTADO_TECLA = {teclaPresionada: false};
for (codigo in CODIGO_TECLA) {
    ESTADO_TECLA[CODIGO_TECLA[codigo]] = false;
}

$(window).keydown(function (e) {
    ESTADO_TECLA.teclaPresionada = true;
    if (CODIGO_TECLA[e.keyCode]) {
        e.preventDefault();
        ESTADO_TECLA[CODIGO_TECLA[e.keyCode]] = true;
    }
}).keyup(function (e) {
    ESTADO_TECLA.teclaPresionada = false;
    if (CODIGO_TECLA[e.keyCode]) {
        e.preventDefault();
        ESTADO_TECLA[CODIGO_TECLA[e.keyCode]] = false;
    }
});

Sprite = function () {
    this.init = function (nombre, puntos) {
        this.nombre = nombre;
        this.puntos = puntos;

        this.velocidad = {
            x: 0,
            y: 0,
            rotar: 0
        };

        this.aceleracion = {
            x: 0,
            y: 0,
            rotar: 0
        };
    };

    this.hijos = {};
    this.color = '#e6e600';
    this.solido = true;
    this.visible = false;
    this.usado = false;
    this.x = 0;
    this.y = 0;
    this.rotar = 0;
    this.escala = 1;
    this.preMove = null;
    this.postMove = null;

    this.run = function (delta) {

        this.mover(delta);
        this.context.save();
        this.configTransformacion();
        this.dibujar();
        this.context.restore();

    };

    this.mover = function (delta) {
        if ($.isFunction(this.preMove)) {
            this.preMove(delta);
        }

        this.velocidad.x += this.aceleracion.x * delta;
        this.velocidad.y += this.aceleracion.y * delta;
        this.x += this.velocidad.x * delta;
        this.y += this.velocidad.y * delta;
        this.rotar += this.velocidad.rotar * delta;
        if (this.rotar > 360) {
            this.rotar -= 360;
        } else if (this.rotar < 0) {
            this.rotar += 360;
        }

        if ($.isFunction(this.postMove)) {
            this.postMove(delta);
        }
    };

    this.configTransformacion = function () {
        if (!this.visible) return;

        var rad = (this.rotar * Math.PI) / 180;

        this.context.translate(this.x, this.y);
        this.context.rotate(rad);
        this.context.scale(this.escala, this.escala);
    };

    this.dibujar = function () {
        if (!this.visible) return;

        this.context.lineWidth = 1.0 / this.escala;

        for (hijo in this.hijos) {
            this.hijos[hijo].dibujar();
        }

        this.context.strokeStyle = this.color;
        this.context.fillStyle = this.color;
        this.context.beginPath();

        this.context.moveTo(this.puntos[0], this.puntos[1]);
        for (var i = 1; i < this.puntos.length / 2; i++) {
            var xi = i * 2;
            var yi = xi + 1;
            this.context.lineTo(this.puntos[xi], this.puntos[yi]);
        }

        this.context.closePath();
        this.context.stroke();
        if (this.solido) {
            this.context.fill();
        }
    };

    this.wrapPostMover = function () {
        if (this.x > Juego.canvasWidth) {
            this.x = 0;
        } else if (this.x < 0) {
            this.x = Juego.canvasWidth;
        }
        if (this.y > Juego.canvasHeight) {
            this.y = 0;
        } else if (this.y < 0) {
            this.y = Juego.canvasHeight;
        }
    };

};

Nave = function () {
    this.init("nave",
        [0,8,
            -3,8,
            -1.5,6,
            -4.5,6.6,
            -4.5,8,
            -5.4,8,
            -5.4,6.8,
            -8,7.2,
            -7,4,
            -5.4,2.4,
            -5.4,-5,
            -4.8,-6,
            -4.5,-5,
            -4.5,1.8,
            -2.5,-5.2,
            0,-11,
            2.5,-5.2,
            4.5,1.8,
            4.5,-5,
            4.8,-6,
            5.4,-5,
            5.4,2.4,
            7,4,
            8,7.2,
            5.4,6.8,
            5.4,8,
            4.5,8,
            4.5,6.6,
            1.5,6,
            3,8,]);

    this.color = '#8533ff';
    this.solido = true;
    this.escala = 2.3;

    this.hijos.escape = new Sprite();
    this.hijos.escape.solido = true;
    this.hijos.escape.color = 'red';
    this.hijos.escape.init("escape",
        [-3,  6,
            0, 11,
            3,  6]);
    this.postMove = this.wrapPostMover;

    this.preMove = function (delta) {
        if (ESTADO_TECLA.izquierda) {
            this.velocidad.rot = -6;
        } else if (ESTADO_TECLA.derecha) {
            this.velocidad.rot  = 6;
        } else {
            this.velocidad.rot  = 0;
        }

        if (ESTADO_TECLA.arriba) {
            var rad = ((this.rot-90) * Math.PI)/180;
            this.aceleracion.x = 0.5 * Math.cos(rad);
            this.aceleracion.y = 0.5 * Math.sin(rad);
            this.hijos.escape.visible = Math.random() > 0.1;
        } else {
            this.aceleracion.x = 0;
            this.aceleracion.y = 0;
            this.hijos.escape.visible = false;
        }

        if (this.retrasoABala > 0) {
            this.retrasoABala -= delta;
        }
        if (ESTADO_TECLA.espacio) {
            if (this.retrasoABala <= 0) {
                this.retrasoABala = 10;
                this.disparar();
            }
        }

        // limitar la velocidad de la nave
        if (Math.sqrt(this.velocidad.x * this.velocidad.x + this.velocidad.y * this.velocidad.y) > 8) {
            this.velocidad.x *= 0.95;
            this.velocidad.y *= 0.95;
        }
    };
};
Nave.prototype = new Sprite();

Asteroide = function () {
    this.init("asteroide",
        [-10, 7,
            -4, 7,
            -2, 10,
            6, 9,
            6, 4,
            9, -4,
            2, -3,
            -4, -6,
            -10, -2,
            -7, -2]);

    this.color = '#86592d';
    this.solido = true;
    this.visible = true;
    this.escala = 5;
    this.postMove = this.wrapPostMover;
};
Asteroide.prototype = new Sprite();



Text = {
    renderGlyphs: function (ctx, area, char) {

        var grafico = area.glyphs[char];

        if (grafico.o) {

            var contorno;
            if (grafico.cached_outline) {
                contorno = grafico.cached_outline;
            } else {
                contorno = grafico.o.split(' ');
                grafico.cached_outline = contorno;
            }

            var longContorno = contorno.length;
            for (var i = 0; i < longContorno;) {

                var valor = contorno[i++];

                switch (valor) {
                    case 'm':
                        ctx.moveTo(contorno[i++], contorno[i++]);
                        break;
                    case 'l':
                        ctx.lineTo(contorno[i++], contorno[i++]);
                        break;

                    case 'q':
                        var cpx = outline[i++];
                        var cpy = outline[i++];
                        ctx.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
                        break;

                    case 'b':
                        var x = outline[i++];
                        var y = outline[i++];
                        ctx.bezierCurveTo(outline[i++], outline[i++], outline[i++], outline[i++], x, y);
                        break;
                }
            }
        }
        if (grafico.ha) {
            ctx.translate(grafico.ha, 0);
        }
    },

    renderTexto: function (texto, tamanio, x, y) {
        this.contenido.save();

        this.contenido.translate(x, y);

        var pixels = tamanio * 70 / (this.area.resolution * 100);
        this.contenido.escala(pixels, -1 * pixels);
        this.contenido.beginPath();
        var chars = texto.split('');
        var charsLength = chars.length;
        for (var i = 0; i < charsLength; i++) {
            this.renderGlyphs(this.contenido, this.area, chars[i]);
        }
        this.contenido.fill();
        this.contenido.restore();
    },

    contenido: null,
    area: null
};

Juego = {

    vidas: 0,
    puntaje: 0,
    totalAsteroids: 5,
    canvasWidth: 800,
    canvasHeight: 600,
    sprites: [],
    nave: null,

    crearAsteroides: function (numero) {
        if (!numero) numero = this.totalAsteroids;
        for (var i = 0; i < numero; i++) {
            var aster = new Asteroide();
            aster.x = Math.random() * this.canvasWidth;
            aster.y = Math.random() * this.canvasHeight;
            aster.velocidad.x = Math.random() * 4 - 2;
            aster.velocidad.y = Math.random() * 4 - 2;
            if (Math.random() > 0.5) {
                aster.puntos.reverse();
            }
            aster.velocidad.rotar = Math.random() * 2 - 1;
            Juego.sprites.push(aster);
        }
    },

    Control: {
        boot: function () {
            Juego.crearAsteroides(this.totalAsteroids);
            this.state = 'esperar';
        },

        esperar: function () {
            Text.renderTexto('PROYECTO SOFTWARE II', 30, Juego.canvasWidth / 2 + 200, Juego.canvasHeight);
            Text.renderTexto('ASTEROIDES', 40, Juego.canvasWidth / 2 - 140, Juego.canvasHeight / 5);
            Text.renderTexto('Presione espacio para comenzar', 36, Juego.canvasWidth / 2 - 370, Juego.canvasHeight / 2);
            if (ESTADO_TECLA.espacio || window.gameStart) {
                ESTADO_TECLA.espacio = false;
                window.gameStart = false;
                this.state = 'inicio';
            }
        },

        inicio: function () {
            Juego.puntaje = 0;
            Juego.vidas = 2;
            Juego.totalAsteroids = 2;
            Juego.crearAsteroides();
            this.state = 'crearNave';
        },

        crearNave: function () {
            Juego.nave.x = Juego.canvasWidth / 2;
            Juego.nave.y = Juego.canvasHeight / 2;
            Juego.nave.rotar = 0;
            Juego.nave.velocidad.x = 0;
            Juego.nave.velocidad.y = 0
			Text.renderTexto('Contador: 0000', 20, Juego.canvasWidth / 2 +490 , Juego.canvasHeight / 20);
            Juego.nave.visible = true;
            this.state = 'run';
        },

        run: function () {
            /*opciones juego*/
        },

        ejecutar: function () {
            this[this.state]();
        },
        state: 'boot'
    }

};


$(function () {
    var canvas = $("#canvas");
    Juego.canvasWidth = canvas.width();
    Juego.canvasHeight = canvas.height();
    var contenido = canvas[0].getContext("2d");

    Text.contenido = contenido;
    Text.area = vector_battle;
    var sprites = [];
    Juego.sprites = sprites;
    Sprite.prototype.context = contenido;

    var nave = new Nave();
    nave.x = Juego.canvasWidth / 2;
    nave.y = Juego.canvasHeight / 2;
    sprites.push(nave);
    Juego.nave = nave;

    var i, j = 0;
    var pausa = false;
    var ultimoFrame = Date.now();
    var frameAcual;
    var tTranscurrido;
    var delta;
    var nodoCanvas = canvas[0];

    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    var mainLoop = function () {
        contenido.clearRect(0, 0, Juego.canvasWidth, Juego.canvasHeight);
        Juego.Control.ejecutar();
        frameAcual = Date.now();
        tTranscurrido = frameAcual - ultimoFrame;
        ultimoFrame = frameAcual;
        delta = tTranscurrido / 30;

        for (i = 0; i < sprites.length; i++) {
            sprites[i].run(delta);
            if (sprites[i].usado) {
                sprites[i].usado = false;
                sprites.splice(i, 1);
                i--;
            }
        }

        if (pausa) {
            Text.renderTexto('PAUSA', 30, 0, Juego.canvasHeight / 5 - 95);
        } else {
            requestAnimFrame(mainLoop, nodoCanvas);
        }
    };

    mainLoop();

    $(window).keydown(function (e) {
        switch (CODIGO_TECLA[e.keyCode]) {
            case 'pausa':
                pausa = !pausa;
                if (!pausa) {
                    // empezar de nuevo
                    ultimoFrame = Date.now();
                    mainLoop();
                }
                break;
        }
    });
});

