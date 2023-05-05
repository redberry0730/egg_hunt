import { mat4, vec4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'
import {bunnyVertices, bunnyNormals} from "./Bunny250t750n.js"
import {sphereVertices, sphereNormals} from "./Sphere180t540n.js"

let player;
export class EggHunt {

    constructor(canvas, keyMap){
        // global camera variables
        this.prevDraw = 0;
        this.program;
        this.gl;
        this.canvas = canvas;
        this.keyMap = keyMap;
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.canvas.style.width = "500px";
                
        // Step 2. initialize webgl context
        this.gl = this.canvas.getContext('webgl2', {antialias: false} );
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Step 3. one-time compile the basic shader program
        this.program = this.compileBasicProgram(this.gl);
        this.gl.useProgram(this.program);
        
        // global drawing variables

        this.camera = vec3.fromValues(1,1,1);
        this.bunny;
        this.shadows = [];
        this.eggs = [];
        //global position data variable 
        this.init();
    }
    init() {

        //square
        let [x0,y0,z0] = [-10.0, 0, -10.0];
        let [x1,y1,z1] = [-10.0, 0, 10.0];
        let [x2,y2,z2] = [10.0, 0, -10.0];
        let [x3,y3,z3] = [10.0, 0, 10.0];
        let [x4,y4,z4] = [-10.0, 0, 10.0];
        let [x5,y5,z5] = [10.0, 0, -10.0];

        const squarePositionsData = [x0,y0,z0,x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4,x5,y5,z5];
        const squareColorsData = [0, 0.75, 0, 0, 0.75, 0, 0, 0.75, 0, 0, 0.75, 0, 0, 0.75, 0, 0, 0.75, 0];
        const squareNormalsData = [0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0];
        this.squareMesh = new TriangleMesh(squarePositionsData, squareColorsData, squareNormalsData, this.camera, this.gl,this.program);
        this.squareMesh.shipStandardAttributes(this.program, this.gl);

        //eggs color
        const sphereColors = [];
        for (let i =0; i < sphereVertices.length; i+=9) {
            sphereColors.push(0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0)
        }
        
        const shadowColors = [];
        for (let i =0; i < sphereVertices.length; i+=9) {
            shadowColors.push(0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0)
        }

        //spawn 7 eggs and its shadows 
        for(let i = 0; i< 7; i++){
            //square size as range
            let min = -9;
            let max = 9;
            let randomCenter = [Math.random()*(max-min)+min, 0.5, Math.random()*(max-min)+min];
            let eggMesh = new TriangleMesh(sphereVertices, sphereColors ,sphereNormals, this.camera, this.gl, this.program);

            this.shadowMesh = new TriangleMesh(sphereVertices, shadowColors ,sphereNormals, this.camera, this.gl, this.program);
            this.shadowMesh.shipStandardAttributes(this.program, this.gl);
            this.shadowMesh.center[0] = randomCenter[0];
            this.shadowMesh.center[2] = randomCenter[2];

            this.shadows.push(this.shadowMesh);

            eggMesh.shipStandardAttributes(this.program,this.gl);
            let egg = new Egg(eggMesh, randomCenter);
            egg.shadowMesh = this.shadowMesh;
            this.eggs.push(egg);
            
        }

        //Bunny
        const bunnyColors = [];
        for (let i =0; i < bunnyVertices.length; i += 9 ){
            bunnyColors.push(0.7,0.2,0.1,0.7,0.2,0.1,0.7,0.2,0.1);
        }

        this.bunnyMesh = new TriangleMesh(bunnyVertices,bunnyColors,bunnyNormals, this.camera,this.gl,this.program);
        this.bunnyMesh.shipStandardAttributes(this.program,this.gl);
        this.bunny = new Bunny(this.bunnyMesh,[0,0.5,0],this.eggs);
        player = this.bunny;
        this.gameOver = false;
    }

    mainloop() {

                
        const elapsed = performance.now() - this.prevDraw;
        //console.log(elapsed)
        //framerate in milli
        if (elapsed < 1000/60) {
            
            return;
        }
        // 1000 seconds = elapsed * fps. So fps = 1000/elapsed
        const fps = 1000 / elapsed;
        // Write the FPS in a <p> element.

        
        // clear canvas, reset buffers, enable depth test
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);

        //Bunny Logic

        if (this.keyMap['ArrowUp']) {
            // moving camera backward
            this.bunny.forward = true;
        }
        else {
            this.bunny.forward = false;
        }
        if (this.keyMap['ArrowDown']) {
            // moving camera backward
            this.bunny.backward = true;
        }
        else {
            this.bunny.backward = false;
        }

        if (this.keyMap['ArrowLeft']) {
            // moving camera backward
            this.bunny.left = true;
        }
        else {
            this.bunny.left = false;
        }

        if (this.keyMap['ArrowRight']) {
            // moving camera backward
            this.bunny.right = true;
        }
        else {
            this.bunny.right = false;
        }

        this.update()
        this.draw();

        for (const egg of this.bunny.eggs) {
            if(!egg.hit) {
                egg.camera = this.camera
                egg.update();
                egg.draw();
            }
        }
        this.prevDraw = performance.now();
    }

    update() {
        //update camera positions
        this.camera = vec3.fromValues(this.bunny.center[0]-2,this.bunny.center[1]+2,this.bunny.center[2]-2);
        this.bunny.camera = this.camera;
        this.squareMesh.camera = this.camera;


        //update eggs
        this.bunny.update();

        for (const egg of this.bunny.eggs) {
            egg.camera = this.camera
            egg.update();
        }
    }

    draw() {

        this.squareMesh.draw();
        if(this.bunny.score === 7 && !this.gameOver) {
            //second bunny color 
            this.gameOver = true;
            const bunnyColors2 = [];
            for (let i =0; i < bunnyVertices.length; i += 9 ){
                bunnyColors2.push(0.1,0.2,0.7,0.1,0.2,0.7,0.1,0.2,0.7);
            }
            

            this.bunny.triangleMesh.ColorsBuffer = this.gl.createBuffer();
            this.bunny.ColorsMemoryID = this.gl.getAttribLocation(this.program, 'aVertexColor');
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bunny.triangleMesh.ColorsBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(bunnyColors2), this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // this unbinds the buffer, prevents bugs
    
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bunny.triangleMesh.ColorsBuffer);
            this.gl.vertexAttribPointer(this.bunny.triangleMesh.ColorsMemoryID, 3, this.gl.FLOAT, false, 0, 0 );
            this.gl.enableVertexAttribArray(this.bunny.ColorsMemoryID);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            
        }

        this.bunny.draw();

        for (const egg of this.bunny.eggs) {
            if(!egg.hit) {
                egg.draw();
                egg.shadowMesh.camera = this.camera;
                egg.shadowMesh.scale = [0.2,0.01,0.2];
                egg.shadowMesh.draw();
            }
        }

        // for (const shadow of this.shadows) {
        //     shadow.camera = this.camera;
        //     shadow.scale = [0.2,0.01,0.2];
        //     shadow.draw();
        // }
    }

    compileBasicProgram(gl) {
        const shaderProgram = gl.createProgram();
        const vertexShaderCode = `#version 300 es
        precision mediump float;
        in vec3 aVertexPosition;
        in vec3 aVertexColor;
        in vec3 aVertexNormal;
        uniform mat4 uPerspectiveTransform; 
        uniform mat4 uViewTransform;
        uniform mat4 uModelTransform;
        uniform mat4 uScaleTransform;
        out vec3 color;
        out vec3 pt;
        out vec3 eye;
        out vec3 n;

        void main(void) {
            vec4 homogenized = vec4(aVertexPosition, 1.0);
            gl_Position = uPerspectiveTransform * uViewTransform * uModelTransform * uScaleTransform * homogenized;
            n = vec3(inverse(transpose(uModelTransform)) * vec4(aVertexNormal, 0.0));

            pt = vec3(uModelTransform * vec4(aVertexPosition, 1.0));

            eye = -vec3(uViewTransform * vec4(0.0, 0.0, 0.0, 1.0));

            color = aVertexColor;
        }
        `;
        const vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShaderObject, vertexShaderCode);
        gl.compileShader(vertexShaderObject);
    
        // good idea to check that it compiled successfully
        if (!gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertexShaderObject));
        }
    
        // next, the fragment shader code
        const fragmentShaderCode = `#version 300 es
        precision mediump float;
        out vec4 FragColor;
        in vec3 color;
        in vec3 n; 
        in vec3 pt; 
        in vec3 eye;
        void main(void) {

            vec3 light = vec3(10.0, 1.5, 10.0);
            vec3 light1 = vec3(0.0, 1.5, 0.0);
            vec3 light2 = vec3(-10.0, 1.5, -10.0);

            vec3 t = normalize(light - pt);
            vec3 toEye = normalize(eye - pt);
            vec3 o = (2.0*dot(t,n)/dot(n,n))*n - t;
            float algn = dot(toEye, o)/(length(toEye)*length(o));
            float s = pow(max(0.0, algn), 10.0);
            float m = abs(dot(t, n))/(length(n)*length(t));

            vec3 t1 = normalize(light1 - pt);
            vec3 toEye1 = normalize(eye - pt);
            vec3 o1 = (2.0*dot(t1,n)/dot(n,n))*n - t1;
            float algn1 = dot(toEye1, o1)/(length(toEye1)*length(o1));
            float s1 = pow(max(0.0, algn1), 10.0);
            float m1 = abs(dot(t1, n))/(length(n)*length(t1));

            vec3 t2 =   normalize(light2 - pt);
            vec3 toEye2 = normalize(eye - pt);
            vec3 o2 = (2.0*dot(t2,n)/dot(n,n))*n - t2;
            float algn2 = dot(toEye2, o2)/(length(toEye2)*length(o2));
            float s2 = pow(max(0.0, algn2), 10.0);
            float m2 = abs(dot(t2, n))/(length(n)*length(t2));
            
            float scale = (max(0.0,m)+max(0.0,m1)+max(0.0,m2));

            //
            float SpecularFinal = 0.0;

            FragColor = vec4(scale*color.x + SpecularFinal, scale*color.y+SpecularFinal, scale*color.z+SpecularFinal, 1.0);
            //FragColor =  vec4(color.x, color.y, color.z, 1.0);
        }
        `;
    
        // send this fragment shader source code to the GPU
        const fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShaderObject, fragmentShaderCode);
    
        // tell GPU to compile it
        gl.compileShader(fragmentShaderObject);
    
        // good idea to check that it compiled successfully
        if (!gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragmentShaderObject));
        }
    
        // attach each of the shaders to the shader program we created earlier
        gl.attachShader(shaderProgram, vertexShaderObject);
        gl.attachShader(shaderProgram, fragmentShaderObject);
    
        // tell GPU to "link" and "use" our program
        gl.linkProgram(shaderProgram);
        return shaderProgram;
    }
}


class Bunny {
    constructor(triangleMesh, center, eggs) {
        this.width = 0.5;
        this.length = 0.5;
        this.center = center;
        this.triangleMesh = triangleMesh;
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.speed = 0.1;
        this.RotateY = triangleMesh.RotateY;
        this.frontVec3 = [1,0,0];
        this.camera = triangleMesh.camera;
        this.eggs = eggs;
        this.score = 0;
        this.ColorsBuffer2;
        this.shadow;
    }
    draw(){
        this.triangleMesh.draw();
    }
    update() {
        

        if(this.backward) {
            this.center[0] += this.speed*this.frontVec3[0];
            if(this.center[0] >= 10 || this.center[0] <= -10) this.center[0] -= this.speed*this.frontVec3[0];
            this.center[2] += this.speed*this.frontVec3[2];
            if(this.center[2] >= 10 || this.center[2] <= -10) this.center[2] -= this.speed*this.frontVec3[2];
        }
        if(this.forward) {
            this.center[0] -= this.speed*this.frontVec3[0];
            if(this.center[0] >= 10 || this.center[0] <= -10) this.center[0] += this.speed*this.frontVec3[0];
            this.center[2] -= this.speed*this.frontVec3[2];
            if(this.center[2] >= 10 || this.center[2] <= -10) this.center[2] += this.speed*this.frontVec3[2];
        }

        if(this.right) {
            this.RotateY -= this.speed;
            this.frontVec3 = vec3.fromValues(Math.cos(this.RotateY),0,-Math.sin(this.RotateY));
        }
        if(this.left) {
            this.RotateY += this.speed;
            this.frontVec3 = vec3.fromValues(Math.cos(this.RotateY),0,-Math.sin(this.RotateY));
        }

        for( const egg of this.eggs) {
            let eggCornerX = egg.center[0]-(egg.length/2);
            let eggCornerZ = egg.center[2]-(egg.width/2);

            let bunnyCornerX = this.center[0]-(this.length/2);
            let bunnyCornerZ = this.center[2]-(this.width/2);

            if (!egg.hit && intervalsOverlap([eggCornerX, eggCornerX+egg.length], [bunnyCornerX, bunnyCornerX+egg.length]) &&
            intervalsOverlap([eggCornerZ, eggCornerZ+this.width], [bunnyCornerZ,bunnyCornerZ+egg.width])){
                this.score += 1;
                egg.hit = true;
                continue;
            }
        }
        //update mesh values
        this.triangleMesh.RotateY = this.RotateY;
        this.triangleMesh.center = this.center;
        this.triangleMesh.camera = this.camera;
    }
}

class Egg {
    constructor(triangleMesh,center) {
        this.center = center;
        this.triangleMesh = triangleMesh;
        this.speed = 0.1;
        this.RotateY = triangleMesh.RotateY;
        this.frontVec3 = [1,0,0];
        this.camera = triangleMesh.camera;
        this.hit = false;
        this.width = 0.4;
        this.length = 0.4;
        this.offset = 0.0;
    }
    draw(){
        this.triangleMesh.scale = [0.2,0.4,0.2];
        this.triangleMesh.draw();

    }
    update() {
        this.triangleMesh.RotateY = this.RotateY;
        this.triangleMesh.center = this.center;
        this.triangleMesh.camera = this.camera;


        if(this.center[1] > 1.5) {
            this.offset = -0.01;
        }
        else if( this.center[1] < 1.0){
            this.offset = 0.01;
        }
        this.center[1] += this.offset;

    }
}

class TriangleMesh {
        
    constructor(PositionsData,ColorsData, NormalsData, camera, gl, program) {

        this.gl = gl;
        this.program = program;
        
        this.center = vec3.fromValues(0,0,0);
        this.RotateY = 0.0;
        this.PositionsData = PositionsData;
        this.PositionBuffer = null;
        this.PositionMemoryID = null;
        

        this.ColorsData = ColorsData;
        this.ColorsBuffer = null;
        this.ColorsMemoryID = null;
        
        this.NormalsData = NormalsData;
        this.NormalsBuffer = null;
        this.NormalsMemoryID = null;
        this.camera = camera;
        this.scale = [1.0,1.0,1.0];
    }

    draw() {
        //update camera position from game.camera
        //this.camera = camera;

        const perspectiveTransform = mat4.create();
        mat4.perspective(
            perspectiveTransform, // where to store the result
            Math.PI/2, // "vertical field of view"
            1, // "aspect ratio"
            0.1, // distance to near plane
            1000 // distance to far plane
        );
        
        // use mat4.lookAt() for the view matrix
        const viewTransform = mat4.create();
        mat4.lookAt(
            viewTransform, // where to store the result
            this.camera, // camera position
            player.center, // camera target
            vec3.fromValues(0, 1, 0), // up vector
        );
        
        // Step 2. Prepare the model matrix
        const modelTransform = mat4.create();
        mat4.translate(
            modelTransform,
            modelTransform,
            this.center,
        );
        
        mat4.rotateY(
            modelTransform,
            modelTransform,
            this.RotateY,
        );
        
        const scaleTransform = mat4.create();
        mat4.scale(
            scaleTransform,
            scaleTransform,
            this.scale,
        );
        
        // Step 3. Ship all the transforms
        this.shipTransforms(this.gl, this.program, perspectiveTransform, viewTransform, modelTransform, scaleTransform);
        
        // these lines tell gl.drawArrays() how to get the data out of the buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.PositionsBuffer);
        this.gl.vertexAttribPointer(this.PositionsMemoryID, 3, this.gl.FLOAT, false, 0, 0 );
        this.gl.enableVertexAttribArray(this.PositionsMemoryID);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        
        // and the colors too
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ColorsBuffer);
        this.gl.vertexAttribPointer(this.ColorsMemoryID, 3, this.gl.FLOAT, false, 0, 0 );
        this.gl.enableVertexAttribArray(this.ColorsMemoryID);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.NormalsBuffer);
        this.gl.vertexAttribPointer(this.NormalsMemoryID, 3, this.gl.FLOAT, false, 0, 0 );
        this.gl.enableVertexAttribArray(this.NormalsMemoryID);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.PositionsData.length/3);
    }
    shipStandardAttributes(){
        //console.log(gl)
        //console.log(program)
        this.PositionsBuffer = this.gl.createBuffer();
        this.PositionsMemoryID = this.gl.getAttribLocation(this.program, 'aVertexPosition');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.PositionsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.PositionsData), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // this unbinds the buffer, prevents bugs
        
        this.ColorsBuffer = this.gl.createBuffer();
        this.ColorsMemoryID = this.gl.getAttribLocation(this.program, 'aVertexColor');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ColorsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.ColorsData), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // this unbinds the buffer, prevents bugs

        this.NormalsBuffer = this.gl.createBuffer();
        this.NormalsMemoryID = this.gl.getAttribLocation(this.program, 'aVertexNormal');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.NormalsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.NormalsData), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // this unbinds the buffer, prevents bugs

    }
    shipTransforms(gl, program, projectionTransform, viewTransform, modelTransform,scaleTransform) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uPerspectiveTransform'), false, projectionTransform);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uViewTransform'), false, viewTransform);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelTransform'), false, modelTransform);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uScaleTransform'), false, scaleTransform);
    }
    
}
function intervalsOverlap(int1, int2) {
    const [a,b] = int1;
    const [c,d] = int2;
    if (a > c) {
        return intervalsOverlap(int2, int1);
    }
    return (b > c);
}