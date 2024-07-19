'use client'
import React, { useEffect, useRef, useState } from "react"
import styles from "./page.module.css"
import * as faceapi from "face-api.js";

interface Point{
    x:number;
    y:number;

}
const EAR_THRESHOLD = 0.25;
const EAR_CONSECUTIVE_FRAMES = 3;
const MODEL_URI = '/models';
const VIDEO_WIDTH=400;
const VIDEO_HEIGHT=400;

const FaceRecognition:React.FC = ()=>{
    let blinkCount = 0;
    let earConsecutiveFrames = 0;
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalId = useRef<any>(null);
    const [modelsLoaded,setModelsLoaded] = useState(false);

    useEffect(
        ()=>{
            const getVideoStream = async ()=>{
                const videoStream:MediaStream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
                const video:HTMLVideoElement = videoRef.current;
                video.srcObject = videoStream;
            
            }

            if(navigator.mediaDevices){
                getVideoStream();
            }

            
        },[]
    )

    useEffect(
        () => {

            const load_models = async () =>{

                const resultado =  await Promise.all(
                    [
                        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
                        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
                        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
                        // faceapi.loadSsdMobilenetv1Model('/models'),
                        // faceapi.loadTinyFaceDetectorModel('/models'),
                        // faceapi.loadFaceLandmarkModel('/models'),
                        //faceapi.loadFaceLandmarkTinyModel('/models'),
                        // faceapi.loadFaceDetectionModel('/models'),
                        //faceapi.loadFaceRecognitionModel('/models')
                    ]
                )
                setModelsLoaded(true);
            }

            load_models();
            
            



            
        }, []
    )

    useEffect(
        ()=>{
            if(modelsLoaded && videoRef.current){
                intervalId.current = setInterval(detectFaces,100);
            }

        },[modelsLoaded]
    )

    const detectFaces = async ()=>{
        if(videoRef.current){
            const detectionResult = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions).withFaceLandmarks().withFaceDescriptor();
            
            
            if(detectionResult && detectionResult.detection.score > 0.8 && videoRef.current && canvasRef.current){
                const leftEye = detectionResult.landmarks.getLeftEye();
                const rightEye = detectionResult.landmarks.getRightEye();
                
                const earLeft = calculateEAR(leftEye);
                const earRight = calculateEAR(rightEye);
                const ear = (earLeft + earRight) / 2.0;
                console.log("Ear:", ear);

                if(ear < EAR_THRESHOLD){
                    console.log("Blicking detected");
                }

                const displaySize={width:canvasRef.current.width,height:canvasRef.current.height};
                const detectionForSize = faceapi.resizeResults(detectionResult, {
                    width: VIDEO_WIDTH,
                    height: VIDEO_HEIGHT
                })
                faceapi.matchDimensions(canvasRef.current,displaySize)
                canvasRef.current.width = videoRef.current.width;
                canvasRef.current.height = videoRef.current.height;
                const context = canvasRef.current.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    
                    faceapi.draw.drawDetections(canvasRef.current, detectionForSize);
                    

                    faceapi.draw.drawFaceLandmarks(canvasRef.current,detectionForSize);
                   
                }
                    
            }
            
            

        }
    }

    function drawLandMark(landmarks:Array<Point>,context:CanvasRenderingContext2D){
        context.fillStyle = 'red';
        landmarks.forEach(point => {
        context.fillRect(point.x, point.y, 4, 4);
  });
    }
    function calculateEAR(eye:Array<Point>):number {
        const p2p6 = distance(eye[1], eye[5]);
        const p3p5 = distance(eye[2], eye[4]);
        const p1p4 = distance(eye[0], eye[3]);
        
        return (p2p6 + p3p5) / (2.0 * p1p4);
      }
  
    function distance(point1:Point, point2:Point):number {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    return(
        <div className={styles.main}>
            <video ref={videoRef} width={400} height={400} className={styles.video} autoPlay></video>
            <canvas ref={canvasRef} width={400} height={400} className={styles.canvas}/>
        </div>
    )
}

export default FaceRecognition;