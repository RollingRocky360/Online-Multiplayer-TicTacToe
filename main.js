const NOT_SELECTED = "rgba(255, 255, 255, 0.4)";
const SELECTED = "rgba(255, 255, 255, 0.8)";
const TEXT_COLOR = "rgb(30, 30, 30)";
const WIN_COLOR = "rgba(151, 255, 149, 0.5)"

let gameId=1;

let startButton = document.querySelector('#init');
let joinButton = document.querySelector('#join')
let cells = document.querySelectorAll('.cell');
let player = document.querySelector('.curr-player');
let bg = document.getElementById('bg');


function checkRow(pattern) {
    let i = pattern-1;
    for (let j=0; j<3; j++) {
        let elmt = document.getElementById(`${3*i + j}`);
        elmt.style.backgroundColor = WIN_COLOR;
        elmt.style.color = "white";
    }
}

function checkCol(pattern) {
    let i = pattern-4;
    for (let k=0; k<3; k++) {
        let elmt = document.getElementById(`${3*k + i}`);
        elmt.style.backgroundColor = WIN_COLOR;
        elmt.style.color = "white";
    }
}

function checkDiag(pattern) {      
  if (pattern == 7) {
    for (let k=0; k<3; k++) {
        let elmt = document.getElementById(`${3*k + k}`);
        elmt.style.backgroundColor = WIN_COLOR;
        elmt.style.color = "white";
    }
  } 
      
  else {
    for (let k=0; k<3; k++) {
        let elmt = document.getElementById(`${3*k + 2-k}`);
        elmt.style.backgroundColor = WIN_COLOR;
    }
  }
}




const sock = new WebSocket('ws://localhost:8001');

sock.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    const {type} = event;
    console.log(event);
    switch (type) {
        case 'init':
            gameId = event.gameId; break;
        case 'join': 
            gameId = event.gameId; break;
        case 'move': 
            const [x, y] = event.pos;
            console.log(event);
            const [player, CURRENT_COIN] = event.player;
            const block = document.getElementById(`${3*x + y}`)
            block.innerText = CURRENT_COIN > 0 ? 'X' : 'O';
            block.style.backgroundColor = SELECTED;
            if (CURRENT_COIN > 0) {
                bg.classList.remove('up');
                bg.classList.add('down');
            }
            else {
                bg.classList.remove('down');
                bg.classList.add('up');
            }
            player.innerText = CURRENT_COIN > 0 ? 'X' : 'O';
            break;
        case 'win':
            let pattern = event.pattern;
            const [i, j] = event.pos;
            let blk = document.getElementById(`${3*i + j}`)
            blk.innerText = CURRENT_COIN > 0 ? 'X' : 'O';
            blk.style.backgroundColor = SELECTED;
            [player, CURRENT_COIN] = event.winner;
            
            if (pattern >= 1 && pattern <= 3)
                checkRow(pattern);
            else if (pattern >= 4 && pattern <= 6)
                checkCol(pattern);
            else
                checkDiag(pattern);
            
            if (CURRENT_COIN < 0) {
                bg.classList.remove('down');
                bg.classList.add('up');
            }
            else {
                bg.classList.remove('up');
                bg.classList.add('down');
            }
            player.innerText = `${CURRENT_COIN < 0 ? 'X' : 'O'} WINS!`;
            break;
        case 'tie':
            player.innerText = "TIE!";
            bg.classList.remove('down');
            bg.classList.remove('up');
            bg.classList.add('middle');
            break;
    }
});


for (let i=0; i<9; i++) {
    cells[i].onclick = (event) => {
        let cell = parseInt(event.target.id);
        const x = Math.floor(cell / 3);
        const y = cell % 3;
        
        sock.send(JSON.stringify({ type: 'move', pos: [x, y], gameId }))    
    }
}

startButton.onclick = joinButton.onclick = ({ target }) => {
    for (let i=0; i<9; i++) {
        cells[i].style.color = TEXT_COLOR;
        cells[i].innerText = '';
        cells[i].style.backgroundColor = NOT_SELECTED;
        cells[i].style.opacity = "1";
    }
    bg.classList.remove('middle');
    bg.classList.add('up');
    player.innerText = 'X';
    sock.send(JSON.stringify({type: target.id, gameId}))
}

