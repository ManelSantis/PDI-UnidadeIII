import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import dicomParser from 'dicom-parser';
import hammer from 'hammerjs';

let cBone = document.getElementById('cBone');
let cOrgan = document.getElementById("cOrgan");
let cSkin = document.getElementById("cSkin");
let cDanger = document.getElementById("cDanger");

let bone = document.getElementById('bone');
let organ = document.getElementById("organ");
let skin = document.getElementById("skin");
let danger = document.getElementById("danger");

let move = document.getElementById('move');
let contrast = document.getElementById('contrast');
let zoom = document.getElementById('zoom')
let rotate = document.getElementById('rotate');

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.Hammer = hammer;

let currentColor = "yellow";
let radios = document.getElementsByName("cor");

//Tools
const WwwcTool = cornerstoneTools.WwwcTool;
const PanTool = cornerstoneTools.PanTool;
const RotateTool = cornerstoneTools.RotateTool;
const ZoomTool = cornerstoneTools.ZoomTool;

let currentTool = "move";

cornerstoneTools.init(
  {
    showSVGCursors: true,
  }
);

const note = 'ArrowAnnotate';

const fileInput = document.getElementById('fileInput');
const element = document.getElementById('dicomImage');
let currentImageId = 0;
const stack = { currentImageIdIndex: 0, imageIds: [], };
const annotations = { currentImageId, imageIds: [], states: [], bones: [], organs: [], skins: [], danger: [] };

let files = [];
cornerstone.enable(element);

cBone.addEventListener('change', function (event) {
  saveByColor(currentColor, currentImageId);
  editVisibility("yellow", cBone.checked);
  bone.disabled = !cBone.checked;
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(files[currentImageId]);

  cornerstone.loadImage(imageId).then(function (image) {
    const viewport = cornerstone.getDefaultViewportForImage(element, image);
    cornerstone.displayImage(element, image, viewport);
    loadAnnotations(currentImageId);
  });
});

cOrgan.addEventListener('change', function (event) {
  saveByColor(currentColor, currentImageId);
  editVisibility("purple", cOrgan.checked);
  organ.disabled = !cOrgan.checked;
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(files[currentImageId]);

  cornerstone.loadImage(imageId).then(function (image) {
    const viewport = cornerstone.getDefaultViewportForImage(element, image);
    cornerstone.displayImage(element, image, viewport);
    loadAnnotations(currentImageId);
  });
});

cSkin.addEventListener('change', function (event) {
  saveByColor(currentColor, currentImageId);
  editVisibility("green", cSkin.checked);
  skin.disabled = !cSkin.checked;
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(files[currentImageId]);

  cornerstone.loadImage(imageId).then(function (image) {
    const viewport = cornerstone.getDefaultViewportForImage(element, image);
    cornerstone.displayImage(element, image, viewport);
    loadAnnotations(currentImageId);
  });
});

cDanger.addEventListener('change', function (event) {
  saveByColor(currentColor, currentImageId);
  editVisibility("red", cDanger.checked);
  danger.disabled = !cDanger.checked;
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(files[currentImageId]);

  cornerstone.loadImage(imageId).then(function (image) {
    const viewport = cornerstone.getDefaultViewportForImage(element, image);
    cornerstone.displayImage(element, image, viewport);
    loadAnnotations(currentImageId);
  });
});

move.addEventListener('click', function (event) {
  move.disabled = true;
  contrast.disabled = false;
  zoom.disabled = false;
  rotate.disabled = false;
  currentTool = "move";
  cornerstoneTools.setToolDisabled('Wwwc')
  cornerstoneTools.setToolDisabled('Zoom')
  cornerstoneTools.setToolDisabled('Rotate')

  cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 })
});

contrast.addEventListener('click', function (event) {
  move.disabled = false;
  contrast.disabled = true;
  zoom.disabled = false;
  rotate.disabled = false;
  currentTool = "contrast";
  cornerstoneTools.setToolDisabled('Pan')
  cornerstoneTools.setToolDisabled('Zoom')
  cornerstoneTools.setToolDisabled('Rotate')

  cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 })
});

zoom.addEventListener('click', function (event) {
  move.disabled = false;
  contrast.disabled = false;
  zoom.disabled = true;
  rotate.disabled = false;
  currentTool = "zoom";

  cornerstoneTools.setToolDisabled('Pan')
  cornerstoneTools.setToolDisabled('Wwwc')
  cornerstoneTools.setToolDisabled('Rotate')

  cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 1 })
});

rotate.addEventListener('click', function (event) {
  move.disabled = false;
  contrast.disabled = false;
  zoom.disabled = false;
  rotate.disabled = true;
  currentTool = "rotate";

  cornerstoneTools.setToolDisabled('Pan')
  cornerstoneTools.setToolDisabled('Wwwc')
  cornerstoneTools.setToolDisabled('Zoom')

  cornerstoneTools.setToolActive('Rotate', { mouseButtonMask: 1 })
});

fileInput.addEventListener('change', function (event) {
  files = event.target.files; //Lista de Arquivos
  currentImageId = 0;
  stack.imageIds = [];
  annotations.imageIds = [];
  annotations.states = [];
  annotations.bones = [];
  annotations.organs = [];
  annotations.skins = [];
  annotations.danger = [];

  for (let i = 0; i < files.length; i++) {
    stack.imageIds.push(i);
  }
  cornerstoneTools.addStackStateManager(element, ['stack']);
  cornerstoneTools.addToolState(element, 'stack', stack);

  const apiTool = cornerstoneTools[`${note}Tool`];
  cornerstoneTools.addTool(apiTool);
  cornerstoneTools.toolColors.setToolColor('rgb(255, 255, 0)');
  cornerstoneTools.setToolActive(note, { mouseButtonMask: 2 })

  for (let i = 0; i < files.length; i++) {
    annotations.imageIds.push(i);
    annotations.states.push([]);
    annotations.bones.push([]);
    annotations.skins.push([]);
    annotations.organs.push([]);
    annotations.danger.push([]);

  }
  cornerstoneTools.addTool(PanTool)
  cornerstoneTools.addTool(WwwcTool)
  cornerstoneTools.addTool(cornerstoneTools.ZoomTool, {
    configuration: {
      invert: false,
      preventZoomOutsideImage: false,
      minScale: .1,
      maxScale: 30.0,
    }
  });
  cornerstoneTools.addTool(RotateTool)

  cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 })
  updateImage(currentImageId);
});

radios.forEach(function (radio) {
  radio.addEventListener("change", function () {
    if (radio.checked) {

      switch (radio.value) {
        case "1":
          saveByColor(currentColor, currentImageId);
          currentColor = "yellow";
          cornerstoneTools.toolColors.setToolColor('rgb(255, 255, 0)');
          break;
        case "2":
          saveByColor(currentColor, currentImageId);
          currentColor = "purple";
          cornerstoneTools.toolColors.setToolColor('rgb(255, 0, 255)');
          break;
        case "3":
          saveByColor(currentColor, currentImageId);
          currentColor = "green";
          cornerstoneTools.toolColors.setToolColor('rgb(0, 255, 0)');
          break;
        case "4":
          saveByColor(currentColor, currentImageId);
          currentColor = "red";
          cornerstoneTools.toolColors.setToolColor('rgb(255,0, 0)');
          break;
      }
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(files[currentImageId]);

      cornerstone.loadImage(imageId).then(function (image) {
        const viewport = cornerstone.getDefaultViewportForImage(element, image);
        cornerstone.displayImage(element, image, viewport);
        loadAnnotations(currentImageId);
      });
    }
  });
});

element.addEventListener('wheel', (e) => {
  if (files.length === 0) return
  if (currentImageId >= 0 && currentImageId < files.length) {
    if (e.wheelDelta < 0 || e.detail > 0) {
      if (currentImageId > 0) {
        saveByColor(currentColor, currentImageId);
        currentImageId--;
      }
    } else {
      if (currentImageId < files.length - 1 && currentImageId >= 0) {
        saveByColor(currentColor, currentImageId);
        currentImageId++;
      }
    }
  } else {
    if (currentImageId < 0) {
      currentImageId = 0;
    }

    if (currentImageId == files.length) {
      currentImageId = files.length - 1;
    }
    saveByColor(currentColor, currentImageId);
  }
  updateImage(currentImageId);
});

function updateImage(newImageId) {
  console.log(annotations.states);
  cornerstoneTools.clearToolState(element, note);

  currentImageId = newImageId;
  stack.currentImageIdIndex = newImageId;
  annotations.currentImageId = newImageId;
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(files[currentImageId]);

  cornerstone.loadImage(imageId).then(function (image) {
    const viewport = cornerstone.getDefaultViewportForImage(element, image);
    cornerstone.displayImage(element, image, viewport);
    loadAnnotations(currentImageId);
  });

}

function loadAnnotations(imageId) {
  if (annotations.states[imageId]) {
    for (const el of annotations.states[imageId]) {
      cornerstoneTools.addToolState(element, note, el);
    }
  }
}

function saveByColor(color, imageId) {

  const currentState = cornerstoneTools.getToolState(element, note);
  if (currentState && currentState.data.length > 0) {

    for (const el of currentState.data) {
      if (el.color === undefined) {
        el.color = color;
      }
    }
    
    annotations.states[imageId] = currentState.data;
  }
}

function editVisibility(color, visible) {

  for (const element of annotations.states){
    for (const el of element) {
      if (el.color == color) {
        el.visible = visible;
      }
    }
  }

  console.log(annotations.states)
}