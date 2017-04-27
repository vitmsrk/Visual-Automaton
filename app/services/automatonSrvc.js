(function (app) {
	'use strict';

	app.service('automatonSrvc', automatonSrvc);

    function automatonSrvc($rootScope) {
        this.regExpToNFA = regExpToNFA;

        function regExpToNFA(regexp) {
            const OPERATORS = ['(', ')', '|', '.', '*', '+'];

            regexp = normalize(regexp);

            var emptyExpressionSymbol = $rootScope.preferences.emptyExpressionSymbol,
                statePrefix = $rootScope.preferences.stateNamePrefix,
                stateIndex = 0,
                S = getAlphabet(regexp),
                P = getPriorities(regexp);

            var automaton = build(0, P.length - 1);
            minimize(automaton);

            return automaton;

            function build(startIndex, endIndex) {
                if (startIndex == endIndex) {
                    var automaton = new Automaton();
                    if (P[startIndex].symbol == emptyExpressionSymbol) {
                        var state = statePrefix + stateIndex;
                        stateIndex += 1;
                        automaton.states.push(state);
                        automaton.start = state;
                        automaton.accept.push(state);
                    } else {
                        var firstState = statePrefix + stateIndex;
                        stateIndex += 1;
                        var secondState = statePrefix + stateIndex;
                        stateIndex += 1;
                        automaton.states.push(firstState);
                        automaton.states.push(secondState);
                        automaton.start = firstState;
                        if (S.indexOf(P[startIndex].symbol) != -1) {
                            automaton.accept.push(secondState);
                        }
                        automaton.transitions.push(new Transition([P[startIndex].symbol], firstState, secondState));
                    }
                    return automaton;
                }

                var operatorIndex = startIndex;
                for (var i = startIndex + 1; i <= endIndex; i++) {
                    if (P[i].priority > 0 && P[i].priority < P[operatorIndex].priority || P[operatorIndex].priority == 0) {
                        operatorIndex = i;
                    }
                }

                var leftAutomaton = null,
                    rightAutomaton = null,
                    automaton = new Automaton();
                leftAutomaton = build(startIndex, operatorIndex - 1);
                if (!isIterator(P[operatorIndex].symbol)) {
                    rightAutomaton = build(operatorIndex + 1, endIndex);
                }
                var state = statePrefix + stateIndex;
                stateIndex += 1;
                automaton.states.push(state);
                automaton.start = state;

                switch (P[operatorIndex].symbol) {
                    case '|':
                        concat(automaton, leftAutomaton, true);
                        concat(automaton, rightAutomaton, true);
                        for (var i in leftAutomaton.transitions) {
                            if (leftAutomaton.transitions[i].source == leftAutomaton.start) {
                                automaton.transitions.push(new Transition(leftAutomaton.transitions[i].input, state, leftAutomaton.transitions[i].target));
                            }
                        }
                        for (var i in rightAutomaton.transitions) {
                            if (rightAutomaton.transitions[i].source == rightAutomaton.start) {
                                automaton.transitions.push(new Transition(rightAutomaton.transitions[i].input, state, rightAutomaton.transitions[i].target));
                            }
                        }
                        if (leftAutomaton.accept.indexOf(leftAutomaton.start) != -1 || rightAutomaton.accept.indexOf(rightAutomaton.start) != -1) {
                            automaton.accept.push(state);
                        }
                        break;
                    case '.':
                        concat(automaton, leftAutomaton, false);
                        concat(automaton, rightAutomaton, true);
                        for (var i in leftAutomaton.transitions) {
                            if (leftAutomaton.transitions[i].source == leftAutomaton.start) {
                                automaton.transitions.push(new Transition(leftAutomaton.transitions[i].input, state, leftAutomaton.transitions[i].target));
                            }
                        }
                        for (var i in rightAutomaton.transitions) {
                            if (rightAutomaton.transitions[i].source == rightAutomaton.start) {
                                for (var j in leftAutomaton.accept) {
                                    automaton.transitions.push(new Transition(rightAutomaton.transitions[i].input, leftAutomaton.accept[j], rightAutomaton.transitions[i].target));
                                }
                            }
                        }
                        if (rightAutomaton.accept.indexOf(rightAutomaton.start) != -1) {
                            for (var i in leftAutomaton.accept) {
                                automaton.accept.push(leftAutomaton.accept[i]);
                            }
                        }
                        break;
                    case '*':
                        concat(automaton, leftAutomaton, true);
                        for (var i in leftAutomaton.transitions) {
                            if (leftAutomaton.transitions[i].source == leftAutomaton.start) {
                                automaton.transitions.push(new Transition(leftAutomaton.transitions[i].input, state, leftAutomaton.transitions[i].target));
                            }
                        }
                        for (var i in leftAutomaton.accept) {
                            for (var j in leftAutomaton.transitions) {
                                if (leftAutomaton.transitions[j].source == leftAutomaton.start) {
                                    automaton.transitions.push(new Transition(leftAutomaton.transitions[j].input, leftAutomaton.accept[i], leftAutomaton.transitions[j].target));
                                }
                            }
                        }
                        automaton.accept.push(state);
                        break;
                    case '+':
                        concat(automaton, leftAutomaton, true);
                        for (var i in leftAutomaton.transitions) {
                            if (leftAutomaton.transitions[i].source == leftAutomaton.start) {
                                automaton.transitions.push(new Transition(leftAutomaton.transitions[i].input, state, leftAutomaton.transitions[i].target));
                            }
                        }
                        for (var i in leftAutomaton.accept) {
                            for (var j in leftAutomaton.transitions) {
                                if (leftAutomaton.transitions[j].source == leftAutomaton.start) {
                                    automaton.transitions.push(new Transition(leftAutomaton.transitions[j].input, leftAutomaton.accept[i], leftAutomaton.transitions[j].target));
                                }
                            }
                        }
                        break;
                }

                return automaton;
            }

            function getAlphabet(regexp) {
                var S = [], t = '';
                for (var i in regexp) {
                    if (isOperator(regexp[i]) || regexp[i] == emptyExpressionSymbol) {
                        if (t) {
                            S.push(t);
                            t = '';
                        }
                        continue;
                    }
                    t += regexp[i];
                }
                if (t) {
                    S.push(t);
                }
                return S;
            }

            function getPriorities(regexp) {
                var B = [], t = '', p = 0;
                for (var i in regexp) {
                    if (isOperator(regexp[i])) {
                        if (t) {
                            B.push(new Priority(t, 0));
                            t = '';           
                        }
                        switch (regexp[i]) {
                            case '(':
                                p += 5;
                                break;
                            case ')':
                                p -= 5;
                                break;
                            case '*':
                                B.push(new Priority(regexp[i], p + 4));
                                break;
                            case '+':
                                B.push(new Priority(regexp[i], p + 3));
                                break;
                            case '.':
                                B.push(new Priority(regexp[i], p + 2));
                                break;
                            case '|':
                                B.push(new Priority(regexp[i], p + 1));
                                break;
                        }
                    } else {
                        t += regexp[i];
                    }
                }
                if (t) {
                    B.push(new Priority(t, 0));
                }
                return B;
            }

            function isOperator(symbol) {
                return OPERATORS.indexOf(symbol) != -1;
            }

            function isIterator(symbol) {
                return symbol == '*' || symbol == '+';
            }

            function Priority(symbol, priority) {
                this.symbol = symbol;
                this.priority = priority;
            }

            function concat(sourceAutomaton, targetAutomaton, acceptation) {
                for (var i in targetAutomaton.states) {
                    sourceAutomaton.states.push(targetAutomaton.states[i]);
                }
                for (var i in targetAutomaton.transitions) {
                    sourceAutomaton.transitions.push(targetAutomaton.transitions[i]);
                }
                if (acceptation) {
                    for (var i in targetAutomaton.accept) {
                        sourceAutomaton.accept.push(targetAutomaton.accept[i]);
                    }
                }
            }

            function normalize(regexp) {
                var t = '', newExp = '';
                for (var i in regexp) {
                    if (isOperator(regexp[i])) {
                        if (t && regexp[i] == '(' && t != '|' && t != '(') {
                            newExp += '.' + regexp[i];
                            t = '';
                        } else {
                            newExp += regexp[i];
                            t = regexp[i];
                        }
                    } else {
                        if (t && (t == emptyExpressionSymbol || t == '*' || t == '+' || t == ')')) {
                            newExp += '.' + regexp[i];
                            t = '';
                        } else {
                            newExp += regexp[i];
                            t = regexp[i];
                        }
                    }
                }
                return newExp;
            }

            function minimize(automaton) {
                var statesToRemove = [];
                for (var i in automaton.states) {
                    if (automaton.transitions.map(function (t) { return t.target }).indexOf(automaton.states[i]) == -1 && automaton.states[i] !== automaton.start) {
                        var transitionsToRemove = [];
                        for (var j in automaton.transitions) {
                            if (automaton.transitions[j].source === automaton.states[i]) {
                                transitionsToRemove.push(automaton.transitions[j]);
                            }
                        }
                        for (var j in transitionsToRemove) {
                            automaton.transitions.splice(automaton.transitions.indexOf(transitionsToRemove[j]), 1);
                        }
                        statesToRemove.push(automaton.states[i]);
                    }
                }
                for (var i in statesToRemove) {
                    automaton.states.splice(automaton.states.indexOf(statesToRemove[i]), 1);
                    if (automaton.accept.indexOf(statesToRemove[i]) != -1) {
                        automaton.accept.splice(automaton.accept.indexOf(statesToRemove[i]), 1);
                    }
                }
            }
        }

        function Automaton() {
            this.states = [];
            this.transitions = [];
            this.start = null;
            this.accept = [];
        }

        function Transition(input, source, target) {
            this.input = input;
            this.source = source;
            this.target = target;
        } 
    }

})(angular.module('VisualAutomatonApp'));