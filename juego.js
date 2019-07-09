
CODIGO_TECLA = {
    32: 'espacio',
    37: 'izquierda',
    38: 'arriba',
    39: 'derecha',
    40: 'abajo',
    80: 'pausa',
    71: 'g',
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

CELDA_SIZE = 60;

Matriz = function (filas, columnas) {
    var i, j;
    this.datos = new Array(filas);
    for (i = 0; i < filas; i++) {
        this.datos[i] = new Array(columnas);
    }

    this.configure = function (rot, escala, transx, transy) {
        var rad = (rot * Math.PI)/180;
        var sin = Math.sin(rad) * escala;
        var cos = Math.cos(rad) * escala;
        this.set(cos, -sin, transx, sin,  cos, transy);
    };

    this.set = function () {
        var k = 0;
        for (i = 0; i < filas; i++) {
            for (j = 0; j < columnas; j++) {
                this.datos[i][j] = arguments[k];
                k++;
            }
        }
    }

    this.multiply = function () {
        var vector = new Array(filas);
        for (i = 0; i < filas; i++) {
            vector[i] = 0;
            for (j = 0; j < columnas; j++) {
                vector[i] += this.datos[i][j] * arguments[j];
            }
        }
        return vector;
    };
};

Sprite = function () {
    this.init = function (nombre, puntos) {
        this.nombre = nombre;
        this.puntos = puntos;

        this.velocidad = {
            x: 0,
            y: 0,
            rot: 0
        };

        this.aceleracion = {
            x: 0,
            y: 0,
            rot: 0
        };
    };

    this.hijos = {};
    this.rotarBan=true;
    this.color = '#e6e601';
    this.solido = true;
    this.visible = false;
    this.usado = false;
    this.x = 0;
    this.y = 0;
    this.rot = 0;
    this.escala = 1;
    this.preMove = null;
    this.postMove = null;
    this.rutaH = true;
    this.rutaV = true;
    this.objetosColisionar = [];
    this.nodoActual = null;
    this.nextSprite  = null;

    this.run = function (delta) {
        this.mover(delta);
        this.actualizarCelda();
        this.contenido.save();
        this.configTransformacion();
        this.dibujar();
        var canidatos = this.encontrarCandidatosColision();
        this.matrix.configure(this.rot, this.escala, this.x, this.y);
        this.comprobarColisionesObjetos(canidatos);
        this.contenido.restore();

        if (this.rutaH && this.nodoActual && this.nodoActual.dupe.horizontal) {
            this.x += this.nodoActual.dupe.horizontal;
            this.contenido.save();
            this.configTransformacion();
            this.dibujar();
            this.comprobarColisionesObjetos(canidatos);
            this.contenido.restore();
            if (this.nodoActual) {
                this.x -= this.nodoActual.dupe.horizontal;
            }
        }
        if (this.rutaV && this.nodoActual && this.nodoActual.dupe.vertical) {
            this.y += this.nodoActual.dupe.vertical;
            this.contenido.save();
            this.configTransformacion();
            this.dibujar();
            this.comprobarColisionesObjetos(canidatos);
            this.contenido.restore();
            if (this.nodoActual) {
                this.y -= this.nodoActual.dupe.vertical;
            }
        }
        if (this.rutaH && this.rutaV &&
            this.nodoActual &&
            this.nodoActual.dupe.vertical &&
            this.nodoActual.dupe.horizontal) {
            this.x += this.nodoActual.dupe.horizontal;
            this.y += this.nodoActual.dupe.vertical;
            this.contenido.save();
            this.configTransformacion();
            this.dibujar();
            this.comprobarColisionesObjetos(canidatos);
            this.contenido.restore();
            if (this.nodoActual) {
                this.x -= this.nodoActual.dupe.horizontal;
                this.y -= this.nodoActual.dupe.vertical;
            }
        }
    };

    this.mover = function (delta) {
        if (!this.visible) return;
        this.transPuntos = null;
        if ($.isFunction(this.preMove)) {
            this.preMove(delta);
        }

        this.velocidad.x += this.aceleracion.x * delta;
        this.velocidad.y += this.aceleracion.y * delta;
        this.x += this.velocidad.x * delta;
        this.y += this.velocidad.y * delta;
        this.rot += this.velocidad.rot * delta;
        if (this.rot > 360) {
            this.rot -= 360;
        } else if (this.rot < 0) {
            this.rot += 360;
        }

        if ($.isFunction(this.postMove)) {
            this.postMove(delta);
        }
    };

    this.actualizarCelda = function () {
        if (!this.visible) return;
        var celdax = Math.floor(this.x / CELDA_SIZE);
        var celday = Math.floor(this.y / CELDA_SIZE);
        celdax = (celdax >= this.grid.length) ? 0 : celdax;
        celday = (celday >= this.grid[0].length) ? 0 : celday;
        celdax = (celdax < 0) ? this.grid.length-1 : celdax;
        celday = (celday < 0) ? this.grid[0].length-1 : celday;
        var nuevoNodo = this.grid[celdax][celday];
        if (nuevoNodo != this.nodoActual) {
            if (this.nodoActual) {
                this.nodoActual.dejar(this);
            }
            nuevoNodo.enter(this);
            this.nodoActual = nuevoNodo;
        }

        if (ESTADO_TECLA.g && this.nodoActual) {
            this.contenido.lineWidth = 3.0;
            this.contenido.strokeStyle = 'green';
            this.contenido.strokeRect(celdax*CELDA_SIZE+2, celday*CELDA_SIZE+2, CELDA_SIZE-4, CELDA_SIZE-4);
            this.contenido.strokeStyle = 'black';
            this.contenido.lineWidth = 1.0;
        }
    };

    this.configTransformacion = function () {
        if (!this.visible) return;
        var rad = (this.rot * Math.PI) / 180;
        this.contenido.translate(this.x, this.y);
        this.contenido.rotate(rad);
        this.contenido.scale(this.escala, this.escala);
    };

    this.dibujar = function () {
        if (!this.visible) return;

        this.contenido.lineWidth = 1.0 / this.escala;

        for (hijo in this.hijos) {
            this.hijos[hijo].dibujar();
        }

        this.contenido.strokeStyle = this.color;
        this.contenido.fillStyle = this.color;
        this.contenido.beginPath();
        this.contenido.moveTo(this.puntos[0], this.puntos[1]);

        for (var i = 1; i < this.puntos.length / 2; i++) {
            var xi = i * 2;
            var yi = xi + 1;
            this.contenido.lineTo(this.puntos[xi], this.puntos[yi]);
        }

        this.contenido.closePath();
        this.contenido.stroke();
        if (this.solido) {
            this.contenido.fill();
        }
    };

    this.encontrarCandidatosColision = function () {
        if (!this.visible || !this.nodoActual) return [];
        var cn = this.nodoActual;
        var canidatos = [];
        if (cn.nextSprite) canidatos.push(cn.nextSprite);
        if (cn.norte.nextSprite) canidatos.push(cn.norte.nextSprite);
        if (cn.sur.nextSprite) canidatos.push(cn.sur.nextSprite);
        if (cn.este.nextSprite) canidatos.push(cn.este.nextSprite);
        if (cn.oeste.nextSprite) canidatos.push(cn.oeste.nextSprite);
        if (cn.norte.este.nextSprite) canidatos.push(cn.norte.este.nextSprite);
        if (cn.norte.oeste.nextSprite) canidatos.push(cn.norte.oeste.nextSprite);
        if (cn.sur.este.nextSprite) canidatos.push(cn.sur.este.nextSprite);
        if (cn.sur.oeste.nextSprite) canidatos.push(cn.sur.oeste.nextSprite);
        return canidatos
    };

    this.comprobarColisionesObjetos = function (candidatos) {
        for (var i = 0; i < candidatos.length; i++) {
            var ref = candidatos[i];
            do {
                this.comprobarColision(ref);
                ref = ref.nextSprite;
            } while (ref)
        }
    };
    this.comprobarColision = function (objeto) {
        if (!objeto.visible || this == objeto || this.objetosColisionar.indexOf(objeto.nombre) == -1) return;
        var trans = objeto.transformarPuntos();
        var px, py;
        var contador = trans.length/2;
        for (var i = 0; i < contador; i++) {
            px = trans[i*2];
            py = trans[i*2 + 1];
            if (($.browser.mozilla) ? this.puntoPoligono(px, py) : this.contenido.isPointInPath(px, py)) {
                objeto.colision(this);
                this.colision(objeto);
                return;
            }
        }
    };

    this.puntoPoligono = function (x, y) {
        var puntos = this.transformarPuntos();
        var j = 2;
        var y0, y1;
        var nodosImpares = false;
        for (var i = 0; i < puntos.length; i += 2) {
            y0 = puntos[i + 1];
            y1 = puntos[j + 1];
            if ((y0 < y && y1 >= y) ||
                (y1 < y && y0 >= y)) {
                if (puntos[i]+(y-y0)/(y1-y0)*(puntos[j]-puntos[i]) < x) {
                    nodosImpares = !nodosImpares;
                }
            }
            j += 2
            if (j == puntos.length) j = 0;
        }
        return nodosImpares;
    };

    this.colision = function () {
    };

    this.desaparecer = function () {
        this.visible = false;
        this.usado = true;
        if (this.nodoActual) {
            this.nodoActual.dejar(this);
            this.nodoActual = null;
        }
    };
    this.transformarPuntos = function () {
        if (this.transPuntos) return this.transPuntos;
        var trans = new Array(this.puntos.length);
        this.matrix.configure(this.rot, this.escala, this.x, this.y);
        for (var i = 0; i < this.puntos.length/2; i++) {
            var xi = i*2;
            var yi = xi + 1;
            var pts = this.matrix.multiply(this.puntos[xi], this.puntos[yi], 1);
            trans[xi] = pts[0];
            trans[yi] = pts[1];
        }
        this.transPuntos = trans;
        return trans;
    };

    this.estaLimpio = function () {
        if (this.objetosColisionar.length == 0) return true;
        var cn = this.nodoActual;
        if (cn == null) {
            var celdax = Math.floor(this.x / CELDA_SIZE);
            var celday = Math.floor(this.y / CELDA_SIZE);
            celdax = (celdax >= this.grid.length) ? 0 : celdax;
            celday = (celday >= this.grid[0].length) ? 0 : celday;
            cn = this.grid[celdax][celday];
        }
        return (cn.estaVacio(this.objetosColisionar) &&
            cn.norte.estaVacio(this.objetosColisionar) &&
            cn.sur.estaVacio(this.objetosColisionar) &&
            cn.este.estaVacio(this.objetosColisionar) &&
            cn.oeste.estaVacio(this.objetosColisionar) &&
            cn.norte.este.estaVacio(this.objetosColisionar) &&
            cn.norte.oeste.estaVacio(this.objetosColisionar) &&
            cn.sur.este.estaVacio(this.objetosColisionar) &&
            cn.sur.oeste.estaVacio(this.objetosColisionar));
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
    this.escala = 2.5;

    this.hijos.escape = new Sprite();
    this.hijos.escape.solido = true;
    this.hijos.escape.color = 'red';
    this.hijos.escape.init("escape",
        [-3,  6,
            0, 11,
            3,  6]);

    this.retardoABala = 0;
    this.postMove = this.wrapPostMover;
    this.objetosColisionar = ["asteroide","vida"];

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

        if (this.retardoABala > 0) {
            this.retardoABala -= delta;
        }
        if (ESTADO_TECLA.espacio) {
            if (this.retardoABala <= 0) {
                this.retardoABala = 6;
                for (var i = 0; i < this.balas.length; i++) {
                    if (!this.balas[i].visible) {
                        var bala = this.balas[i];
                        var rad = ((this.rot-90) * Math.PI)/180;
                        var vectorx = Math.cos(rad);
                        var vectory = Math.sin(rad);
                        // mover la punta de la nave
                        bala.x = this.x + vectorx * 4;
                        bala.y = this.y + vectory * 4;
                        bala.velocidad.x = 6 * vectorx + this.velocidad.x;
                        bala.velocidad.y = 6 * vectory + this.velocidad.y;
                        bala.visible = true;
                        break;
                    }
                }
            }
        }

        // limitar la velocidad de la nave
        if (Math.sqrt(this.velocidad.x * this.velocidad.x + this.velocidad.y * this.velocidad.y) > 8) {
            this.velocidad.x *= 0.95;
            this.velocidad.y *= 0.95;
        }
    };

    this.colision = function (objeto) {
        if(objeto.nombre=="asteroide") {
            Juego.explosionObjetos(objeto.x, objeto.y);
            Juego.Control.state = 'jugadorMuerto';
            this.visible = false;
            this.nodoActual.dejar(this);
            this.nodoActual = null;
            Juego.vidas--;
        }
        if(objeto.nombre=="vida"){
            Juego.explosionObjetos(objeto.x, objeto.y);
            this.visible = true;
            this.nodoActual.dejar(this);
            this.nodoActual = null;
            Juego.vidas++;
        }
    };
};
Nave.prototype = new Sprite();

Bala = function () {
    this.init("bala", [0, 0]);
    this.tiempo = 0;
    this.rutaH = false;
    this.rutaV = false;
    this.postMove = this.wrapPostMove;
    this.configTransformacion = function () {};
    this.dibujar = function () {
        if (this.visible) {
            this.contenido.save();
            this.contenido.lineWidth = 3;
            this.contenido.beginPath();
            this.contenido.moveTo(this.x-1, this.y-1);
            this.contenido.lineTo(this.x+1, this.y+1);
            this.contenido.moveTo(this.x+1, this.y-1);
            this.contenido.lineTo(this.x-1, this.y+1);
            this.contenido.stroke();
            this.contenido.restore();
        }
    };

    this.preMove = function (delta) {
        if (this.visible) {
            this.tiempo += delta;
        }
        if (this.tiempo > 200) {
            this.visible = false;
            this.tiempo = 0;
        }
    };
    this.colision = function (objeto) {
        this.tiempo = 0;
        this.visible = false;
        this.nodoActual.dejar(this);
        this.nodoActual = null;
    };
    this.transformarPuntos = function (objeto) {
        return [this.x, this.y];
    };
};
Bala.prototype = new Sprite();

Vida = function () {
    this.init("vida",
        [0,   0,
        10,10,
        20,0,
        15,-10,
        10,-5,
        5,-10
        ]);

    this.color = '#FF3333';
    this.solid = true;
    this.visible = true;
    this.escala = 1;
    this.postMove = this.wrapPostMover;
    this.objetosColisionar = ["nave"];

    this.colision = function (objeto) {
        this.visible = false;
        this.nodoActual.dejar(this);
        this.nodoActual = null;
    };
};
Vida.prototype= new Sprite();

Asteroide = function () {
    this.init("asteroide",
        [-10,   0,
            -5,   7,
            -3,   4,
            1,  10,
            5,   4,
            10,   0,
            5,  -6,
            2, -10,
            -4, -10,
            -4,  -5]);

    this.color = '#86592d';
    this.solido = true;
    this.visible = true;
    this.escala = 6;
    this.postMove = this.wrapPostMover;
    this.objetosColisionar = ["bala","nave"];
    this.colision = function (objeto) {
        if (objeto.nombre == "bala") Juego.puntaje += 120 / this.escala;
        console.log(objeto.nombre);
        this.escala /= 3;
        if (this.escala > 0.5) {
            // romper en fragmentos el asteroide
            for (var i = 0; i < 3; i++) {
                var roid = $.extend(true, {}, this);
                roid.velocidad.x = Math.random() * 6 - 3;
                roid.velocidad.y = Math.random() * 6 - 3;
                if (Math.random() > 0.5) {
                    roid.puntos.reverse();
                }
                roid.velocidad.rot = Math.random() * 2 - 1;
                roid.mover(roid.escala * 3);
                Juego.sprites.push(roid);
            }
        }
        Juego.explosionObjetos(objeto.x, objeto.y);
        this.desaparecer();
    };
};
Asteroide.prototype = new Sprite();

Explosion = function () {
    this.init("explosion");
    this.rutaH = false;
    this.rutaV = false;
    this.lines = [];

    for (var i = 0; i < 5; i++) {
        var rad = 2 * Math.PI * Math.random();
        var x = Math.cos(rad);
        var y = Math.sin(rad);
        this.lines.push([x, y, x*2, y*2]);
    }

    this.dibujar = function () {
        if (this.visible) {
            this.contenido.save();
            this.contenido.strokeStyle = 'red';
            this.contenido.lineWidth = 1.0 / this.escala;
            this.contenido.beginPath();
            for (var i = 0; i < 5; i++) {
                var line = this.lines[i];
                this.contenido.moveTo(line[0], line[1]);
                this.contenido.lineTo(line[2], line[3]);
            }
            this.contenido.stroke();
            this.contenido.restore();
        }
    };

    this.preMove = function (delta) {
        if (this.visible) {
            this.escala += delta;
        }
        if (this.escala > 8) {
            this.desaparecer();
        }
    };
};
Explosion.prototype = new Sprite();

CeldaNodo = function () {
    this.norte = null;
    this.sur = null;
    this.este  = null;
    this.oeste  = null;
    this.nextSprite = null;

    this.dupe = {
        horizontal: null,
        vertical:   null
    };

    this.enter = function (sprite) {
        sprite.nextSprite = this.nextSprite;
        this.nextSprite = sprite;
    };

    this.dejar = function (sprite) {
        var ref = this;
        while (ref && (ref.nextSprite != sprite)) {
            ref = ref.nextSprite;
        }
        if (ref) {
            ref.nextSprite = sprite.nextSprite;
            sprite.nextSprite = null;
        }
    };

    this.estaVacio = function (objColisiones) {
        var vacio = true;
        var ref = this;
        while (ref.nextSprite) {
            ref = ref.nextSprite;
            vacio = !ref.visible || objColisiones.indexOf(ref.nombre) == -1
            if (!vacio) break;
        }
        return vacio;
    };
};

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
        this.contenido.scale(pixels, -1 * pixels);
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

    crearVidas: function (numero) {
        for (var i = 0; i < numero; i++) {
            var vida = new Vida();
            vida.x = Math.random() * this.canvasWidth;
            vida.y = 0;
            vida.velocidad.x = Math.random() * 4 - 2;
            vida.velocidad.y = Math.random() * 4 - 2;
            vida.rotar=0;
            Juego.sprites.push(vida);
        }
    },

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
            aster.velocidad.rot = Math.random() * 2 - 1;
            Juego.sprites.push(aster);
        }
    },

    explosionObjetos: function (x, y) {
        var xplosion = new Explosion();
        xplosion.x = x;
        xplosion.y = y;
        xplosion.visible = true;
        Juego.sprites.push(xplosion);
    },

    Control: {
        boot: function () {        	
            Juego.crearVidas(1);
            Juego.crearAsteroides(5);
            this.state = 'esperar';
        },

        esperar: function () {
            Text.renderTexto('PROYECTO SOFTWARE II', 30, Juego.canvasWidth / 2 + 200, Juego.canvasHeight);
            Text.renderTexto('Star SHIP', 40, Juego.canvasWidth / 2 - 140, Juego.canvasHeight / 5);
            Text.renderTexto('Presione espacio para comenzar', 36, Juego.canvasWidth / 2 - 370, Juego.canvasHeight / 2);
            if (ESTADO_TECLA.espacio || window.gameStart) {
                ESTADO_TECLA.espacio = false;
                window.gameStart = false;
                this.state = 'inicio';
            }
        },

        inicio: function () {
            for (var i = 0; i < Juego.sprites.length; i++) {
                if (Juego.sprites[i].nombre == 'asteroide') {
                    Juego.sprites[i].desaparecer();
                } else if (Juego.sprites[i].nombre == 'bala') {
                    Juego.sprites[i].visible = false;
                }
            }
            Juego.puntaje = 0;
            Juego.vidas = 2;
            Juego.totalAsteroids = 1;
            Juego.crearAsteroides();
            this.state = 'crearNave';
        },

        crearNave: function () {
            Juego.nave.x = Juego.canvasWidth / 2;
            Juego.nave.y = Juego.canvasHeight / 2;
            if (Juego.nave.estaLimpio()) {
                Juego.nave.rot = 0;
                Juego.nave.velocidad.x = 0;
                Juego.nave.velocidad.y = 0;
                Juego.nave.visible = true;
                this.state = 'run';
            }
        },

        run: function () {
            for (var i = 0; i < Juego.sprites.length; i++) {
                if (Juego.sprites[i].nombre == 'asteroide') {
                    break;
                }
            }
            if (i == Juego.sprites.length) {
                this.state = 'nuevoNivel';
            }
        },

        nuevoNivel: function () {
            Text.renderTexto('NUEVO NIVEL', 50, Juego.canvasWidth/2 - 190, Juego.canvasHeight/2 + 10);
            if (this.timer == null) {
                this.timer = Date.now();
            }
            if (Date.now() - this.timer > 3000) {
                this.timer = null;
                Juego.totalAsteroids++;
                if (Juego.totalAsteroids > 12) Juego.totalAsteroids = 12;
                Juego.crearAsteroides();
                this.state = 'run';
            }
        },

        jugadorMuerto: function () {
            if (Juego.vidas <= 0) {
                this.state = 'finJuego';
            } else {
                if (this.timer == null) {
                    this.timer = Date.now();
                }
                if (Date.now() - this.timer > 1000) {
                    this.timer = null;
                    this.state = 'crearNave';
                }
            }
        },
        finJuego: function () {
            Text.renderTexto('SEGUNDA ES TODO :v', 50, Juego.canvasWidth/2 - 280, Juego.canvasHeight/2 + 10);
            if (this.timer == null) {
                this.timer = Date.now();
            }
            if (Date.now() - this.timer > 6000) {
                this.timer = null;
                this.state = 'esperar';
            }

            window.gameStart = false;
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

    var celdaAncho = Math.round(Juego.canvasWidth / CELDA_SIZE);
    var celdaAlto = Math.round(Juego.canvasHeight / CELDA_SIZE);
    var celda = new Array(celdaAncho);
    for (var i = 0; i < celdaAncho; i++) {
        celda[i] = new Array(celdaAlto);
        for (var j = 0; j < celdaAlto; j++) {
            celda[i][j] = new CeldaNodo();
        }
    }

    // establecer las referencias de posicion
    for (var i = 0; i < celdaAncho; i++) {
        for (var j = 0; j < celdaAlto; j++) {
            var node   = celda[i][j];
            node.norte = celda[i][(j == 0) ? celdaAlto-1 : j-1];
            node.sur = celda[i][(j == celdaAlto-1) ? 0 : j+1];
            node.oeste  = celda[(i == 0) ? celdaAncho-1 : i-1][j];
            node.este  = celda[(i == celdaAncho-1) ? 0 : i+1][j];
        }
    }

    // establecer los bordes
    for (var i = 0; i < celdaAncho; i++) {
        celda[i][0].dupe.vertical            =  Juego.canvasHeight;
        celda[i][celdaAlto-1].dupe.vertical = -Juego.canvasHeight;
    }

    for (var j = 0; j < celdaAlto; j++) {
        celda[0][j].dupe.horizontal           =  Juego.canvasWidth;
        celda[celdaAncho-1][j].dupe.horizontal = -Juego.canvasWidth;
    }

    var sprites = [];
    Juego.sprites = sprites;

    // todos los sprites usan las variables
    Sprite.prototype.contenido = contenido;
    Sprite.prototype.grid    = celda;
    Sprite.prototype.matrix  = new Matriz(2, 3);

    var nave = new Nave();
    nave.x = Juego.canvasWidth / 2;
    nave.y = Juego.canvasHeight / 2;
    sprites.push(nave);
    nave.balas = [];
    for (var i = 0; i < 100; i++) {
        var objBala = new Bala();
        nave.balas.push(objBala);
        sprites.push(objBala);
    }
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
        if (ESTADO_TECLA.g) {
            contenido.beginPath();
            for (var i = 0; i < celdaAncho; i++) {
                contenido.moveTo(i * CELDA_SIZE, 0);
                contenido.lineTo(i * CELDA_SIZE, Juego.canvasHeight);
            }
            for (var j = 0; j < celdaAlto; j++) {
                contenido.moveTo(0, j * CELDA_SIZE);
                contenido.lineTo(Juego.canvasWidth, j * CELDA_SIZE);
            }
            contenido.closePath();
            contenido.stroke();
        }

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

        //Vidas
        var vidasTexto = 'Vidas: '+Juego.vidas
        Text.renderTexto(vidasTexto, 21, Juego.canvasWidth / 2 +490 , Juego.canvasHeight / 10);

        //Puntaje
        var puntajeTexto = 'Puntaje: '+Juego.puntaje;
        Text.renderTexto(puntajeTexto, 21, Juego.canvasWidth / 2 +480 , Juego.canvasHeight / 20);

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

