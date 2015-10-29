var WebGLDemos;
(function (WebGLDemos) {
    var StarShape = (function () {
        function StarShape(x, y, translation, rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection) {
            this.x = 0;
            this.y = 0;
            this.translation = [0, 0];
            this.rotation = [0, 0];
            this.velocity = 0;
            this.starSize = 0;
            this.texture = 0;
            this.rotationSpeed = 0;
            this.rotationAngle = 0;
            this.rotationDirection = 0;
            this.x = (typeof x == "undefined") ? 0 : x;
            this.y = (typeof y == "undefined") ? 0 : y;
            this.translation = (typeof translation == "undefined") ? [x, y] : translation;
            this.rotation = (typeof rotation == "undefined") ? [0, 0] : rotation;
            this.velocity = (typeof velocity == "undefined") ? 0 : velocity;
            this.starSize = (typeof starSize == "undefined") ? 0 : starSize;
            this.texture = (typeof texture == "undefined") ? 0 : texture;
            this.rotationSpeed = (typeof rotationSpeed == "undefined") ? 0 : rotationSpeed;
            this.rotationAngle = (typeof rotationAngle == "undefined") ? 0 : rotationAngle;
            this.rotationDirection = (typeof rotationDirection == "undefined") ? 0 : rotationDirection;
        }
        return StarShape;
    })();
    var StarfieldTS = (function () {
        //
        // Constructor =================================================
        //
        function StarfieldTS(gl, gameCanvas) {
            this.texturesLoaded = false;
            this.yTranslation = -1;
            this.starTexturesCount = 5;
            showMessageInfo('[StarfieldTS] - ()');
            this.gl = gl;
            this.gameCanvas = gameCanvas;
        }
        //
        // Public =================================================
        //
        StarfieldTS.prototype.init = function () {
            showMessageInfo('[StarfieldTS] - init');
            $('#game_background').css("background-image", "url(../images/background0.png)");
            this.yTranslation = -1;
            this.stars = new Array();
            starsVertices = new Array();
            this.initVertices();
            this.initTextures();
            this.initShaders();
            loadImages([
                "../images/star0.png",
                "../images/star1.png",
                "../images/star2.png",
                "../images/star3.png",
                "../images/star4.png"
            ], this.starTexturesLoaded.bind(this));
        };
        StarfieldTS.prototype.changeSettings = function () {
            showMessageInfo('[StarfieldTS] - changeSettings');
            starsVertices = this.initVertices();
        };
        StarfieldTS.prototype.run = function (frames) {
            if (this.texturesLoaded) {
                showMessageInfo('[StarfieldTS] - run');
                this.yTranslation = frames;
                this.drawScene();
            }
        };
        StarfieldTS.prototype.release = function () {
            if (this.glTextures != null) {
                for (var i = 0; i < this.glTextures.length; i++) {
                    this.gl.deleteTexture(this.glTextures[i]);
                }
            }
            this.gl.deleteShader(this.shaderFragment);
            this.gl.deleteShader(this.shaderVertex);
            this.gl.deleteBuffer(this.bufferTextures);
            this.gl.deleteBuffer(this.bufferDrawing);
            this.gl.deleteProgram(this.shaderProgram);
        };
        StarfieldTS.prototype.gameUI_handleKey = function (charCode) {
        };
        //
        // Private =================================================
        //
        StarfieldTS.prototype.starTexturesLoaded = function (images) {
            showMessageInfo('[StarfieldTS] - StarTexturesLoaded - init - image loaded');
            this.starTextures = images;
            this.texturesLoaded = true;
        };
        StarfieldTS.prototype.initShaders = function () {
            showMessageInfo('[StarfieldTS] - InitShaders');
            this.shaderFragment = compileShaderFromSource(this.gl, "../shaders/starfield-ts.fs", this.gl.FRAGMENT_SHADER);
            this.shaderVertex = compileShaderFromSource(this.gl, "../shaders/starfield-ts.vs", this.gl.VERTEX_SHADER);
            this.shaderProgram = this.gl.createProgram();
            this.gl.attachShader(this.shaderProgram, this.shaderVertex);
            this.gl.attachShader(this.shaderProgram, this.shaderFragment);
            this.gl.linkProgram(this.shaderProgram);
            if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS))
                showMessage("Could not initialise shaders");
            this.gl.useProgram(this.shaderProgram);
            this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "a_position");
            this.texCoordLocation = this.gl.getAttribLocation(this.shaderProgram, "a_texCoord");
            this.resolutionLocation = this.gl.getUniformLocation(this.shaderProgram, "u_resolution");
            this.matrixLocation = this.gl.getUniformLocation(this.shaderProgram, "u_matrix");
            this.bufferTextures = this.gl.createBuffer();
            this.bufferDrawing = this.gl.createBuffer();
        };
        StarfieldTS.prototype.drawScene = function () {
            showMessageInfo('[StarfieldTS] - DrawScene');
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferTextures);
            var textureVertices = this.buildStarTextureBuffer();
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureVertices), this.gl.STATIC_DRAW);
            this.gl.enableVertexAttribArray(this.texCoordLocation);
            this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.uniform2f(this.resolutionLocation, this.gameCanvas.width, this.gameCanvas.height);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferDrawing);
            this.gl.enableVertexAttribArray(this.positionLocation);
            this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
            this.updateVertices();
        };
        StarfieldTS.prototype.updateVertices = function () {
            showMessageInfo('[StarfieldTS] - UpdateVertices');
            for (var i = 0; i < STARS_NUM; i++) {
                var star = this.stars[i];
                var velocity = star.velocity;
                var starSize = star.starSize;
                var texture = star.texture;
                var rotationSpeed = star.rotationSpeed;
                var rotationDirection = star.rotationDirection;
                var rotationAngle = 0;
                if (rotationDirection == 0)
                    rotationAngle = star.rotationAngle + 1;
                else
                    rotationAngle = star.rotationAngle - 1;
                if (rotationAngle >= 360 || rotationAngle <= -360)
                    rotationAngle = 0;
                star.translation[0] = star.x;
                star.translation[1] = star.translation[1] + velocity + 1;
                if (star.translation[1] > this.gameCanvas.height) {
                    star.x = parseInt(getRandom(this.gameCanvas.width));
                    star.y = -1; //parseInt(getRandom(gameCanvas.height));
                    velocity = parseInt(getRandom(STARS_VELOCITY));
                    starSize = parseInt(getRandom(STARS_SIZE));
                    texture = parseInt(getRandomFromZero(5));
                    rotationSpeed = parseInt(getRandomFromZero(STARS_ROTATION_SPEED));
                    rotationAngle = 0;
                    rotationDirection = parseInt(getRandomFromZero(2));
                    star.translation = [star.x, star.y];
                    star.rotation = [0, 1];
                }
                this.updateRotation(rotationAngle, rotationDirection, star.rotation);
                star = new StarShape(star.x, star.y, star.translation, star.rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection);
                stars[i] = star;
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.starTextures[texture]);
                var angleInRadians = this.getAngleInRadians(star.rotationAngle, star.rotationDirection);
                var moveOriginMatrix = this.makeTranslation((star.starSize / 2) * -1, (star.starSize / 2) * -1);
                var translationMatrix = this.makeTranslation(star.translation[0], star.translation[1]);
                var rotationMatrix = this.makeRotation(angleInRadians);
                var matrix = moveOriginMatrix;
                matrix = this.matrixMultiply(matrix, rotationMatrix);
                matrix = this.matrixMultiply(matrix, translationMatrix);
                this.gl.uniformMatrix3fv(this.matrixLocation, false, matrix);
                this.setStarGeometry(star);
                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
                printStar('UPDATE', i, star);
            }
        };
        StarfieldTS.prototype.setStarGeometry = function (star) {
            var x = 0;
            var y = 0;
            var x1 = x;
            var x2 = x + star.starSize;
            var y1 = y;
            var y2 = y + star.starSize;
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
                x1, y1,
                x2, y1,
                x1, y2,
                x1, y2,
                x2, y1,
                x2, y2
            ]), this.gl.STATIC_DRAW);
        };
        StarfieldTS.prototype.initVertices = function () {
            showMessageInfo('[StarfieldTS] - InitVertices');
            for (var i = 0; i < STARS_NUM; i++) {
                var x = parseInt(getRandom(this.gameCanvas.width));
                var y = -1; //parseInt(getRandom(gameCanvas.height));
                var velocity = parseInt(getRandom(STARS_VELOCITY));
                var starSize = (STARS_NUM > 1 ? parseInt(getRandom(STARS_SIZE)) : STARS_SIZE);
                var texture = parseInt(getRandomFromZero(5));
                var rotationSpeed = parseInt(getRandomFromZero(STARS_ROTATION_SPEED));
                var rotationDirection = parseInt(getRandomFromZero(2));
                var translation = [x, y];
                var rotation = [0, 1];
                var star = new StarShape(x, y, translation, rotation, velocity, starSize, texture, rotationSpeed, 0, rotationDirection);
                this.stars.push(star);
                printStar('INIT', i, star);
            }
        };
        StarfieldTS.prototype.initTextures = function () {
            this.glTextures = new Array(this.starTexturesCount);
            for (var i = 0; i < this.starTexturesCount; i++) {
                var texture = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.glTextures[i] = texture;
            }
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        };
        StarfieldTS.prototype.buildStarTextureBuffer = function () {
            showMessageInfo('[StarfieldTS] - BuildStarTextureBuffer');
            var vertices = [];
            for (var i = 0; i < STARS_NUM; i++) {
                vertices.push(0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0);
            }
            return vertices;
        };
        StarfieldTS.prototype.updateRotation = function (angleValue, direction, rotation) {
            var angleInDegrees = 360 - angleValue;
            var angleInRadians = angleInDegrees * Math.PI / 180;
            if (direction == 0) {
                rotation[0] = Math.sin(angleInRadians);
                rotation[1] = Math.cos(angleInRadians);
            }
            else {
                rotation[0] = Math.sin(angleInRadians);
                rotation[1] = Math.cos(angleInRadians);
            }
            return rotation;
        };
        StarfieldTS.prototype.getAngleInRadians = function (angle, direction) {
            var angleInDegrees = 360 - angle;
            var angleInRadians = angleInDegrees * Math.PI / 180;
            return angleInRadians;
        };
        StarfieldTS.prototype.makeTranslation = function (tx, ty) {
            return [
                1, 0, 0,
                0, 1, 0,
                tx, ty, 1
            ];
        };
        StarfieldTS.prototype.makeRotation = function (angleInRadians) {
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            return [
                c, -s, 0,
                s, c, 0,
                0, 0, 1
            ];
        };
        StarfieldTS.prototype.matrixMultiply = function (a, b) {
            var a00 = a[0 * 3 + 0];
            var a01 = a[0 * 3 + 1];
            var a02 = a[0 * 3 + 2];
            var a10 = a[1 * 3 + 0];
            var a11 = a[1 * 3 + 1];
            var a12 = a[1 * 3 + 2];
            var a20 = a[2 * 3 + 0];
            var a21 = a[2 * 3 + 1];
            var a22 = a[2 * 3 + 2];
            var b00 = b[0 * 3 + 0];
            var b01 = b[0 * 3 + 1];
            var b02 = b[0 * 3 + 2];
            var b10 = b[1 * 3 + 0];
            var b11 = b[1 * 3 + 1];
            var b12 = b[1 * 3 + 2];
            var b20 = b[2 * 3 + 0];
            var b21 = b[2 * 3 + 1];
            var b22 = b[2 * 3 + 2];
            return [
                a00 * b00 + a01 * b10 + a02 * b20,
                a00 * b01 + a01 * b11 + a02 * b21,
                a00 * b02 + a01 * b12 + a02 * b22,
                a10 * b00 + a11 * b10 + a12 * b20,
                a10 * b01 + a11 * b11 + a12 * b21,
                a10 * b02 + a11 * b12 + a12 * b22,
                a20 * b00 + a21 * b10 + a22 * b20,
                a20 * b01 + a21 * b11 + a22 * b21,
                a20 * b02 + a21 * b12 + a22 * b22
            ];
        };
        return StarfieldTS;
    })();
    WebGLDemos.StarfieldTS = StarfieldTS;
})(WebGLDemos || (WebGLDemos = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcmZpZWxkdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9kZW1vcy9zdGFyZmllbGR0cy50cyJdLCJuYW1lcyI6WyJXZWJHTERlbW9zIiwiV2ViR0xEZW1vcy5TdGFyU2hhcGUiLCJXZWJHTERlbW9zLlN0YXJTaGFwZS5jb25zdHJ1Y3RvciIsIldlYkdMRGVtb3MuU3RhcmZpZWxkVFMiLCJXZWJHTERlbW9zLlN0YXJmaWVsZFRTLmNvbnN0cnVjdG9yIiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5pbml0IiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5jaGFuZ2VTZXR0aW5ncyIsIldlYkdMRGVtb3MuU3RhcmZpZWxkVFMucnVuIiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5yZWxlYXNlIiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5nYW1lVUlfaGFuZGxlS2V5IiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5zdGFyVGV4dHVyZXNMb2FkZWQiLCJXZWJHTERlbW9zLlN0YXJmaWVsZFRTLmluaXRTaGFkZXJzIiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5kcmF3U2NlbmUiLCJXZWJHTERlbW9zLlN0YXJmaWVsZFRTLnVwZGF0ZVZlcnRpY2VzIiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5zZXRTdGFyR2VvbWV0cnkiLCJXZWJHTERlbW9zLlN0YXJmaWVsZFRTLmluaXRWZXJ0aWNlcyIsIldlYkdMRGVtb3MuU3RhcmZpZWxkVFMuaW5pdFRleHR1cmVzIiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy5idWlsZFN0YXJUZXh0dXJlQnVmZmVyIiwiV2ViR0xEZW1vcy5TdGFyZmllbGRUUy51cGRhdGVSb3RhdGlvbiIsIldlYkdMRGVtb3MuU3RhcmZpZWxkVFMuZ2V0QW5nbGVJblJhZGlhbnMiLCJXZWJHTERlbW9zLlN0YXJmaWVsZFRTLm1ha2VUcmFuc2xhdGlvbiIsIldlYkdMRGVtb3MuU3RhcmZpZWxkVFMubWFrZVJvdGF0aW9uIiwiV2Vi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Q0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZCQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2QkEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZCQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2QkEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZCQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2QkEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZCQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2QkEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZCQSxNQUFNQSxDQUFDQTtnQkFDTEEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0E7Z0JBQ2pDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQTtnQkFDakNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBO2dCQUNqQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0E7Z0JBQ2pDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQTtnQkFDakNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBO2dCQUNqQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0E7Z0JBQ2pDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQTtnQkFDakNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBO2FBQ2xDQSxDQUFDQTtRQUNKQSxDQUFDQTtRQUVIbkIsa0JBQUNBO0lBQURBLENBQUNBLEFBclZESCxJQXFWQ0E7SUFyVllBLHNCQUFXQSxjQXFWdkJBLENBQUFBO0FBQ0hBLENBQUNBLEVBbFhNLFVBQVUsS0FBVixVQUFVLFFBa1hoQiJ9