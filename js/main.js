import {InsertElement, ConmuteClassAndInner} from './utils.js'
import {loadDataFile} from './files.js'
import * as views from "./views.js";


let Questions = {}    
let TotalQuestions = {}    
let actualQuestionCounter = 0
let countdownTimer = {}
let aviableShuffle = true
let totalTime = 0 
let answered = {}
let totalErrors = 0
let totalPoints = 0
let pointsBySuccess = 100
let multiplier = 1;
let timeByAns = 60
let timeleft = timeByAns-1
window.views = views

views.GoTo("Registro")
// views.GoTo("Instrucciones01")
// views.GoTo("PreguntaVertical")
// views.GoTo("Ranking")

loadDataFile("txt").then((res)=>{
    TotalQuestions = res[0].Questions;
});

window.TryLogin = (form)=>{
    if(PermitForm(form)){
        localStorage.setItem("UltimoIndex"  ,(parseInt( localStorage.getItem("UltimoIndex") ) || 0)+1);
        let actualUltimoIndex = localStorage.getItem("UltimoIndex");
        let listaIndices = JSON.parse(localStorage.getItem("listaIndices") ||JSON.stringify([]));
        listaIndices.push( "m"+actualUltimoIndex )
        localStorage.setItem("listaIndices", JSON.stringify(listaIndices));
    
        localStorage.setItem("Nombre_m"+actualUltimoIndex,  form.elements['idNombreCompleto'].value );
        localStorage.setItem("Correo_m"+actualUltimoIndex,  form.elements['idCorreo'].value );
        localStorage.setItem("Telefono_m"+actualUltimoIndex,  form.elements['idTelefono'].value );
        localStorage.setItem("Puntos_m"+actualUltimoIndex,  "00.00" );
    
        views.GoTo("Instrucciones01")
    } else{
        alert('Usuario ya participó.')
    }
     return false;
}

const PermitForm = (form)=>{
    let exist = false;
    let listaIndices = JSON.parse(localStorage.getItem("listaIndices") ||JSON.stringify([]));
    for (const i in listaIndices) {
        exist |= (localStorage.getItem("Correo_"+listaIndices[i]) === form.elements['idCorreo'].value);
        exist |= (localStorage.getItem("Telefono_"+listaIndices[i]) === form.elements['idTelefono'].value);
    }
    return !exist;
}

window.GoToLobby = ()=>{
    SetLobby();
    loadDataFile("txt").then((res)=>{
        Questions = res[0].Questions;
    });
}


window.GoRanking = ()=>{
    views.GoTo("Ranking").then((res)=>{
        let listaIndices = JSON.parse(localStorage.getItem("listaIndices") ||JSON.stringify([]));
        FillRanking(listaIndices);
    });
}


//////////////////////////////////////////////
const FillRanking = (listaIndices)=>{
    let users = []
    for (const i in listaIndices) {
        let user ={}
        user.username= localStorage.getItem("Nombre_"+listaIndices[i] );
        user.score= localStorage.getItem("Puntos_"+listaIndices[i] );
        users.push(user);
    }
    users.sort((a, b) => { return b.score - a.score; });
    
    let container = document.getElementById('tablasRR');
    let tables = InsertElement('table',[],'',container);
    for (let i = 0; i < users.length; i++) {
        let tr = InsertElement('tr',['EstiloPuntaje'],'',tables);
        InsertElement('th',['PosicionJugadorRanking'],'#'+(i+1),tr);
        InsertElement('th',['NombreJugadorRanking'],users[i].username,tr);
        InsertElement('th',['PuntajeJugadorRanking'],users[i].score,tr);
    }
    
}

const GoToResults = ()=>{
    document.body.classList.add('avoidEvents');
    views.GoTo("Resultados").then((res)=>{
        let actualUltimoIndex = localStorage.getItem("UltimoIndex");
        localStorage.setItem("Puntos_m"+actualUltimoIndex,  totalPoints );

        document.getElementById('correctAnswers').innerHTML =(Questions.length-totalErrors-1)+'/'+ (Questions.length-1)
        document.getElementById('totalTime').innerHTML =new Date(totalTime*1000).toISOString().substring(14, 19);
        document.getElementById('score').innerHTML = totalPoints;
        document.body.classList.remove('avoidEvents');
    });
}

window.InitQuestionsAndGoFirst = ()=>{
    ResetGeneralStatus();
    Questions = TotalQuestions.sort(() => .5 - Math.random()).slice(0,6);
    GoQuestion(actualQuestionCounter);
}

const ResetGeneralStatus = ()=>{
    aviableShuffle = true;
    actualQuestionCounter = 0;
    answered = [];
    totalErrors = 0;
    totalPoints = 0;
    totalTime = 0;
}
const GoQuestion = (qId)=>{
    views.GoTo("PreguntaVertical").then((res)=>{
        SetQuestionAndAnswers(Questions[qId]);
        SetPowerUpShuffle(Questions[qId])
        RunTimer(Questions[qId])
    });
}

const UpdateStatus = (q, time, isCorrect)=>{
    // answered[q.id] = isCorrect;
    answered[actualQuestionCounter] = isCorrect;
    totalErrors += isCorrect? 0 : 1;
    AccumTime(time)
    if (isCorrect)
        AccumPoints(timeleft+1,pointsBySuccess)
}


//////////////////////////////////////////////////////////////////////

const SetPowerUpShuffle = (q)=>{
    if(aviableShuffle)
        document.getElementById('powerUpShuffle').removeAttribute("nodisplay")  ;
    document.getElementById('powerUpShuffle').addEventListener('click', () =>{
        UseShuffle(q)
    });
}

const UseShuffle = (q)=>{
    console.log("USED SHUFFLE!");
    aviableShuffle = false;
    clearInterval(countdownTimer);
    GoQuestion(5);
}


const AccumTime = (time)=>{
    totalTime += time;
}
const AccumPoints = (pointsT, pointsS)=>{
    multiplier = 1;
    totalPoints += (pointsT+pointsS*multiplier)
}


const AnimateAnswer = (element, classTarget, innerTarget, ansText, interval)=>{
    clearInterval(countdownTimer);
    document.body.classList.add('avoidEvents');
    ConmuteClassAndInner(element,classTarget,'dumb',ansText)
    setTimeout(() => {ConmuteClassAndInner(element,'dumb',classTarget,ansText)}, interval);
    setTimeout(() => {ConmuteClassAndInner(element,classTarget,'dumb',ansText)}, interval*2);
    setTimeout(() => {ConmuteClassAndInner(element,'dumb',classTarget,ansText)}, interval*3);
    setTimeout(() => {ConmuteClassAndInner(element,classTarget,'dumb',ansText)}, interval*4);
    setTimeout(() => {NextQuestionOrResults(); document.body.classList.remove('avoidEvents');}, interval*5);
}

const NextQuestionOrResults = ()=>{
    if (Object.keys(answered).length === (Questions.length-1) )
        GoToResults();
    else
        GoQuestion(++actualQuestionCounter);
}

const RunTimer = (question)=>{
    timeleft = timeByAns -1;
    countdownTimer = setInterval(() => {
        document.getElementsByClassName("TiempoJuego")[0].textContent =timeleft
        timeleft--;
        if (timeleft < 0) {
            UpdateStatus(question, timeByAns, false)
            AnimateAnswer(document.getElementById('EstiloPregunta'),'RespuestaIncorrecta','', question.statement, 300);
        }
    }, 1000);//Second by second
}

const Answer = (ans, question)=>{
    UpdateStatus(question, timeByAns-timeleft-1, ans.isCorrect)
    let classTarget = ans.isCorrect ?'RespuestaCorrecta':'RespuestaIncorrecta';
    let innerTarget = ans.isCorrect ?'¡Correcto!':'¡Incorrecto!';
    AnimateAnswer(document.getElementById('answer'+ans.id), classTarget, innerTarget, ans.text, 300);

}


const SetQuestionAndAnswers = (question)=>{
    document.getElementById('EstiloPregunta').innerHTML = question.statement;
    for(let ans of question.Answers){
        InsertElement('div',['space'+(ans.id === '0'?'4vh':'1_6vh')],'',document.getElementById('answersList'));
        InsertElement('div',['EstiloRespuestas','dumb'],ans.text,document.getElementById('answersList'),'answer'+ans.id).addEventListener("click", () => Answer(ans, question));
    }
}

