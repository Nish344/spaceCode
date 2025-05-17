const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#33ccff',
  parent: 'game-container',
  physics: { default: 'arcade' },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player, cursors, bullets, lastFired = 0;
let questionText, scoreText, currentQuestion = 0, score = 0;
let optionsGroup, correctOption, questionData;
let optionContainers = [];
let questionActive = true;
const totalQuestions = 5;

function preload() {
  this.load.image('ship', 'images/player.png');
  this.load.image('bullet', 'images/bullet.png');
}

async function create() {
  cursors = this.input.keyboard.createCursorKeys();
  bullets = this.physics.add.group();
  optionsGroup = this.add.group(); // Not a physics group here

  player = this.physics.add.sprite(config.width / 2, config.height - 50, 'ship').setCollideWorldBounds(true);

  scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
  questionText = this.add.text(config.width / 2, 50, '', { fontSize: '28px', fill: '#fff', wordWrap: { width: 700 } }).setOrigin(0.5, 0);

  await loadNextQuestion.call(this);

  this.physics.add.overlap(bullets, optionsGroup.getChildren().map(c => c.bodySprite), (bullet, optionBodySprite) => {
    bullet.destroy();
    let container = optionContainers.find(c => c.bodySprite === optionBodySprite);
    if (!container || !questionActive) return;

    if (container.getData('isCorrect')) {
      score++;
      scoreText.setText('Score: ' + score);
    }
    questionActive = false;
    nextOrEnd.call(this);
  });
}

function update(time) {
  if (!player) return;
  player.setVelocityX(0);
  if (cursors.left.isDown) player.setVelocityX(-400);
  if (cursors.right.isDown) player.setVelocityX(400);

  if (cursors.space.isDown && time > lastFired) {
    let bullet = bullets.create(player.x, player.y - 20, 'bullet');
    bullet.setVelocityY(-600);
    lastFired = time + 300;
  }

  // Move options down manually
  optionContainers.forEach(container => {
    container.y += 2; // Adjust speed here
    container.bodySprite.y = container.y;

    // If option goes off screen
    if (container.y > config.height + 50 && questionActive) {
      questionActive = false;
      nextOrEnd.call(this);
    }
  });
}

async function loadNextQuestion() {
  if (currentQuestion >= totalQuestions) {
    this.add.text(config.width / 2, config.height / 2, `Game Over!\nScore: ${score}/${totalQuestions}`, {
      fontSize: '48px',
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);
    player.destroy();
    optionContainers.forEach(c => c.destroy());
    return;
  }

  questionActive = true;
  optionContainers.forEach(c => c.destroy());
  optionContainers = [];

  questionData = await fetchQuestion("HTML", "one word mcqs about Tags", "easy");
  correctOption = questionData.answer;
  questionText.setText(`Q${currentQuestion + 1}. ${questionData.question}`);

  Phaser.Utils.Array.Shuffle(questionData.options).forEach((opt, i) => {
    let x = 150 + i * 200;
    let y = 100;

    // Rectangle
    let graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(-80, -30, 160, 60);

    // Text
    let optionText = this.add.text(0, 0, opt.toUpperCase(), {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Container
    let optionContainer = this.add.container(x, y, [graphics, optionText]);
    optionContainer.setData('isCorrect', opt === correctOption);
    optionContainer.setData('label', opt);

    // Add a hidden body sprite for physics overlap
    let bodySprite = this.physics.add.sprite(x, y, null).setVisible(false);
    optionContainer.bodySprite = bodySprite;

    optionsGroup.add(bodySprite);
    optionContainers.push(optionContainer);
  });

  currentQuestion++;
}

function nextOrEnd() {
  loadNextQuestion.call(this);
}

// Example mock
// async function fetchQuestion(subject, topic, difficulty) {
//   return {
//     question: "Arrays store elements of the same ____",
//     options: ["value", "index", "type", "value"],
//     answer: "type"
//   };

