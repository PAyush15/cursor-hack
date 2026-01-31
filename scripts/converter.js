/**
 * AR Viewer - 3D Model Converter
 * Converts OBJ & STL files to GLB format in-browser using Three.js
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// State
let currentScene = null;
let currentFile = null;
let mtlData = null;
let glbBlob = null;
let previewRenderer = null;
let previewCamera = null;
let animationId = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const mtlSection = document.getElementById('mtlSection');
const mtlInput = document.getElementById('mtlInput');
const mtlBtn = document.getElementById('mtlBtn');
const mtlStatus = document.getElementById('mtlStatus');
const previewSection = document.getElementById('previewSection');
const previewCanvas = document.getElementById('previewCanvas');
const previewStats = document.getElementById('previewStats');
const fileName = document.getElementById('fileName');
const convertingSection = document.getElementById('convertingSection');
const convertStatus = document.getElementById('convertStatus');
const resultSection = document.getElementById('resultSection');
const downloadBtn = document.getElementById('downloadBtn');
const viewArBtn = document.getElementById('viewArBtn');
const convertAnother = document.getElementById('convertAnother');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // File input handlers
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // MTL handlers
    mtlBtn.addEventListener('click', () => mtlInput.click());
    mtlInput.addEventListener('change', handleMtlSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Result actions
    downloadBtn.addEventListener('click', downloadGLB);
    viewArBtn.addEventListener('click', viewInAR);
    convertAnother.addEventListener('click', resetConverter);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleMtlSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            mtlData = event.target.result;
            mtlStatus.textContent = `✓ ${file.name} loaded`;
            mtlStatus.style.color = 'var(--accent-primary)';
            if (currentFile) {
                processFile(currentFile);
            }
        };
        reader.readAsText(file);
    }
}

async function processFile(file) {
    currentFile = file;
    const ext = file.name.split('.').pop().toLowerCase();

    fileName.textContent = file.name;

    if (ext === 'obj') {
        mtlSection.style.display = 'block';
    } else {
        mtlSection.style.display = 'none';
    }

    showSection('converting');
    convertStatus.textContent = `Loading ${file.name}...`;

    try {
        let object;

        switch (ext) {
            case 'obj':
                object = await loadOBJ(file);
                break;
            case 'stl':
                object = await loadSTL(file);
                break;
            case 'gltf':
            case 'glb':
                object = await loadGLTF(file);
                break;
            default:
                throw new Error(`Unsupported format: ${ext}`);
        }

        currentScene = createScene(object);
        showSection('preview');
        renderPreview(currentScene);

        convertStatus.textContent = 'Converting to GLB...';
        await convertToGLB(currentScene);

        // Auto-redirect to index after successful conversion
        // The index page will show the uploaded model and update QR code
        const modelName = currentFile.name.replace(/\.[^.]+$/, '');
        await storeModelInIndexedDB(glbBlob, modelName);
        window.location.href = 'index.html?uploaded=' + encodeURIComponent(modelName);

    } catch (error) {
        console.error('Error processing file:', error);
        alert(`Error: ${error.message}`);
        resetConverter();
    }
}

function loadOBJ(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const contents = event.target.result;
            const loader = new OBJLoader();

            if (mtlData) {
                const mtlLoader = new MTLLoader();
                const materials = mtlLoader.parse(mtlData);
                materials.preload();
                loader.setMaterials(materials);
            }

            try {
                const object = loader.parse(contents);
                object.traverse((child) => {
                    if (child.isMesh && !child.material) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x888888,
                            metalness: 0.3,
                            roughness: 0.7
                        });
                    }
                });
                resolve(object);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function loadSTL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loader = new STLLoader();
                const geometry = loader.parse(event.target.result);
                geometry.computeVertexNormals();

                const material = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    metalness: 0.3,
                    roughness: 0.7
                });

                const mesh = new THREE.Mesh(geometry, material);
                resolve(mesh);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function loadGLTF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loader = new GLTFLoader();
                loader.parse(event.target.result, '', (gltf) => {
                    resolve(gltf.scene);
                }, reject);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function createScene(object) {
    const scene = new THREE.Scene();

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        const scale = 2 / maxDim;
        object.scale.multiplyScalar(scale);
    }

    scene.add(object);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    let vertices = 0;
    let triangles = 0;
    object.traverse((child) => {
        if (child.isMesh && child.geometry) {
            const geo = child.geometry;
            vertices += geo.attributes.position ? geo.attributes.position.count : 0;
            triangles += geo.index ? geo.index.count / 3 : (geo.attributes.position ? geo.attributes.position.count / 3 : 0);
        }
    });

    previewStats.innerHTML = `
        <span>Vertices: ${vertices.toLocaleString()}</span>
        <span>Triangles: ${Math.floor(triangles).toLocaleString()}</span>
    `;

    return scene;
}

function renderPreview(scene) {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (previewRenderer) {
        previewRenderer.dispose();
        previewCanvas.innerHTML = '';
    }

    const width = previewCanvas.clientWidth;
    const height = 300;

    previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setSize(width, height);
    previewRenderer.setPixelRatio(window.devicePixelRatio);
    previewRenderer.setClearColor(0x000000, 0);
    previewCanvas.appendChild(previewRenderer.domElement);

    previewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    previewCamera.position.set(3, 2, 3);
    previewCamera.lookAt(0, 0, 0);

    function animate() {
        animationId = requestAnimationFrame(animate);
        scene.rotation.y += 0.005;
        previewRenderer.render(scene, previewCamera);
    }

    animate();
}

function convertToGLB(scene) {
    return new Promise((resolve, reject) => {
        const exporter = new GLTFExporter();

        const exportScene = new THREE.Scene();
        scene.traverse((child) => {
            if (child.isMesh) {
                exportScene.add(child.clone());
            }
        });

        exporter.parse(
            exportScene,
            (result) => {
                glbBlob = new Blob([result], { type: 'model/gltf-binary' });
                resolve(glbBlob);
            },
            reject,
            { binary: true }
        );
    });
}

function downloadGLB() {
    if (!glbBlob) return;

    const baseName = currentFile.name.replace(/\.[^.]+$/, '');
    const url = URL.createObjectURL(glbBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function viewInAR() {
    if (!glbBlob) return;

    const modelName = currentFile.name.replace(/\.[^.]+$/, '');

    // Use IndexedDB for large files (supports much larger sizes than sessionStorage)
    storeModelInIndexedDB(glbBlob, modelName)
        .then(() => {
            window.location.href = 'viewer.html?model=custom';
        })
        .catch((error) => {
            console.error('Failed to store model:', error);
            // Fallback: create a blob URL
            const blobUrl = URL.createObjectURL(glbBlob);
            try {
                sessionStorage.setItem('customModelUrl', blobUrl);
                sessionStorage.setItem('customModelName', modelName);
                window.location.href = 'viewer.html?model=custom';
            } catch (e) {
                alert('Model is too large. Please download the GLB file and host it on a web server.');
                downloadGLB();
            }
        });
}

/**
 * Store model in IndexedDB for large file support
 * Stores as 'customModel' (current) and also adds to models list
 */
function storeModelInIndexedDB(blob, name) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ARViewerDB', 2);

        request.onerror = () => reject(request.error);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('models')) {
                db.createObjectStore('models', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('uploadedModels')) {
                db.createObjectStore('uploadedModels', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['models', 'uploadedModels'], 'readwrite');
            const store = transaction.objectStore('models');
            const uploadedStore = transaction.objectStore('uploadedModels');

            const timestamp = Date.now();
            const uniqueId = 'model_' + timestamp;

            // Store as current custom model
            const currentModelData = {
                id: 'customModel',
                name: name,
                blob: blob,
                timestamp: timestamp
            };

            // Also store in uploaded models list
            const uploadedModelData = {
                id: uniqueId,
                name: name,
                blob: blob,
                timestamp: timestamp
            };

            store.put(currentModelData);
            uploadedStore.put(uploadedModelData);

            transaction.oncomplete = () => resolve(uniqueId);
            transaction.onerror = () => reject(transaction.error);
        };
    });
}

function showSection(section) {
    previewSection.style.display = section === 'preview' || section === 'result' ? 'block' : 'none';
    convertingSection.style.display = section === 'converting' ? 'flex' : 'none';
    resultSection.style.display = section === 'result' ? 'block' : 'none';
}

function resetConverter() {
    currentFile = null;
    currentScene = null;
    mtlData = null;
    glbBlob = null;

    fileInput.value = '';
    mtlInput.value = '';
    mtlStatus.textContent = '';
    mtlSection.style.display = 'none';

    showSection('upload');
    previewSection.style.display = 'none';

    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (previewRenderer) {
        previewRenderer.dispose();
        previewCanvas.innerHTML = '';
    }
}
