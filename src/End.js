import React from 'react';
import PropTypes from 'prop-types';


const End = props => <div>score: {props.score}</div>;

End.propTypes = {
  score: PropTypes.number.isRequired,
};

export default End;
