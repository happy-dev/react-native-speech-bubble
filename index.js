import React, { PropTypes } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import TypeWriter from './TypeWriter';

const propTypes = {
  allowSkip: PropTypes.bool,
  allowSpeechReplay: PropTypes.bool,
  onSpeechEnd: PropTypes.func,
  onSpeechNext: PropTypes.func,
  onSpeechReplay: PropTypes.func,
  speaker: PropTypes.string,
  speakerStyle: View.propTypes.style,
  speakerTextStyle: Text.propTypes.style,
  speechBubbleActiveOpacity: PropTypes.number,
  speechBubbleStyle: View.propTypes.style,
  speechBubbleTextStyle: Text.propTypes.style,
  speeches: PropTypes.array.isRequired,
  style: View.propTypes.style,
};

const styles = StyleSheet.create({
  dialogView: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  dialog: {
    flexDirection: 'row',
    borderRadius: 50,
    backgroundColor: 'white',
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 20,
    paddingLeft: 20,
    paddingRight: 10,
    paddingTop: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  dialogText: {
    flex: 1,
  },
  dialogNext: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'transparent',
  },
});

class SpeechBubble extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      speechIndex: 0,
      speechBubbleScale: new Animated.Value(1),
      nextDialogAnimation: new Animated.ValueXY(),
      replaySpeechBubbleAnimation: new Animated.Value(0),
      typeEnd: false,
      lastSpeech: false,
    };

    this.onSpeechBubblePress = this.onSpeechBubblePress.bind(this);
    this.onSpeechBubblePressIn = this.onSpeechBubblePressIn.bind(this);
    this.onSpeechBubblePressOut = this.onSpeechBubblePressOut.bind(this);
    this.nextSpeechBubbleAnimation = this.nextSpeechBubbleAnimation.bind(this);
    this.replaySpeechBubbleAnimation = this.replaySpeechBubbleAnimation.bind(this);
  }

  componentDidMount() {
    this.nextSpeechBubbleAnimation();
    this.replaySpeechBubbleAnimation();
  }

  onSpeechBubblePress() {
    const { allowSkip, speechIndex, typeEnd } = this.state;
    const { onSpeechNext, onSpeechReplay, speeches } = this.props;

    if (allowSkip || typeEnd) {
      if (speechIndex + 1 < speeches.length) {
        const lastSpeech = (speechIndex + 1) + 1 === speeches.length;

        // Next speech
        if (onSpeechNext) {
          onSpeechNext();
        }

        this.setState({
          speechIndex: speechIndex + 1,
          typeEnd: false,
          lastSpeech,
        });
      } else {
        // Replay speech
        if (onSpeechReplay) {
          onSpeechReplay();
        }

        if (this.props.allowSpeechReplay) {
          this.setState({
            speechIndex: 0,
            typeEnd: false,
            lastSpeech: speeches.length === 1,
          });
        }
      }
    }
  }

  onSpeechBubblePressIn() {
    Animated.spring(this.state.speechBubbleScale, {
      toValue: 0.9,
      tension: 40,
      friction: 3,
    }).start();
  }

  onSpeechBubblePressOut() {
    Animated.spring(this.state.speechBubbleScale, {
      toValue: 1,
      tension: 40,
      friction: 3,
    }).start();
  }

  nextSpeechBubbleAnimation() {
    const anim = this.state.nextDialogAnimation;
    const translateDuration = 200;

    Animated.sequence([
      Animated.timing(anim.y, {
        toValue: -5,
        duration: translateDuration,
      }),
      Animated.timing(anim.y, {
        toValue: 5,
        duration: translateDuration,
      }),
    ]).start(() => {
      this.nextSpeechBubbleAnimation();
    });
  }

  get NextSpeechBubble() {
    return !this.state.lastSpeech ? (
      <Animated.View
        style={[
          styles.dialogNext,
          { transform: [{ translateY: this.state.nextDialogAnimation.y }] },
          { opacity: this.state.typeEnd && !this.state.lastSpeech ? 1 : 0 },
        ]}
      >
        <Image source={require('./assets/ic_touch_app.png')} />
      </Animated.View>
    ) : null;
  }

  replaySpeechBubbleAnimation() {
    const anim = this.state.replaySpeechBubbleAnimation;
    const rotateDuration = 750;

    Animated.sequence([
      Animated.timing(anim, {
        toValue: 100,
        duration: rotateDuration,
      }),
      Animated.delay(1000),
      Animated.timing(anim, {
        toValue: 0,
        duration: rotateDuration,
      }),
    ]).start(() => {
      this.replaySpeechBubbleAnimation();
    });
  }

  get ReplaySpeechBubble() {
    const interpolatedRotateAnimation = this.state.replaySpeechBubbleAnimation.interpolate({
      inputRange: [0, 100],
      outputRange: ['0deg', '360deg'],
    });

    return this.state.lastSpeech ? (
      <Animated.View
        style={[
          styles.dialogNext,
          { transform: [{ rotate: interpolatedRotateAnimation }] },
          { opacity: this.state.typeEnd && this.state.lastSpeech ? 1 : 0 },
        ]}
      >
        <Image
          source={require('./assets/ic_replay.png')}
        />
      </Animated.View>
    ) : null;
  }

  render() {
    return (
      <View style={this.props.style}>
        <View style={this.props.speakerStyle}>
          <Text style={this.props.speakerTextStyle}> {this.props.speaker} </Text>
        </View>
        <TouchableOpacity
          style={{ transform: [{ scale: this.state.speechBubbleScale }] }}
          activeOpacity={this.props.speechBubbleActiveOpacity || 0.6}
          onPress={this.onSpeechBubblePress}
          onPressIn={this.onSpeechBubblePressIn}
          onPressOut={this.onSpeechBubblePressOut}
        >
          <View style={this.props.speechBubbleStyle || styles.dialog}>
            <View style={this.props.speechBubbleTextStyle || styles.dialogText}>
              <TypeWriter
                text={this.props.speeches[this.state.speechIndex]}
                typing={1}
                onTypingEnd={() => {
                  if (this.props.onSpeechEnd) {
                    this.props.onSpeechEnd();
                  }

                  this.setState({ typeEnd: true });
                }}
              />
            </View>
            {this.NextSpeechBubble}
            {this.ReplaySpeechBubble}
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

SpeechBubble.propTypes = propTypes;

export default SpeechBubble;
