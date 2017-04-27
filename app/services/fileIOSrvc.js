(function (app) {
	'use strict';

	app.service('fileIOSrvc', fileIOSrvc);

    function fileIOSrvc($rootScope, $window) {
        this.serialize = serialize;
        this.deserialize = deserialize;
        this.saveAsImage = saveAsImage;

        function serialize(tab) {
            var automaton = new Automaton(tab.title || $rootScope.translation.NEW_TAB + ' ' + tab.index);
            
            for (var i in tab.states) {
                var state = new State(tab.states[i].name, new Position(tab.states[i].use.x.animVal.value, tab.states[i].use.y.animVal.value));
                automaton.states.push(state);
                if (tab.states[i].start) {
                    automaton.start = state.name;
                }
                if (tab.states[i].accept) {
                    automaton.accept.push(state.name);
                }
            }

            for (var i in tab.transitions) {
                var transition = new Transition(tab.transitions[i].symbols, tab.transitions[i].startState.name, tab.transitions[i].endState.name, tab.transitions[i].h);
                automaton.transitions.push(transition);
            }

            var blob = new Blob([JSON.stringify(automaton)], { type: 'application/json' }),
                url = $window.URL || $window.webkitURL,
                fileUrl = url.createObjectURL(blob);

            var fileDownloader = document.getElementById('file-downloader');
            fileDownloader.setAttribute('href', fileUrl);
            fileDownloader.setAttribute('download', automaton.title.replace(' ', '_') + '.json');
            fileDownloader.click();
        }

        function deserialize(source) {
            var reader = new FileReader();
            reader.onload = (function (file) {
                return function (e) {
                    try {
                        var json = JSON.parse(e.target.result);
                        $rootScope.$emit('drawFromFile', json);
                    }
                    catch (ex) {
                        alert(ex);
                    }
                }
            })(source);
            reader.readAsText(source);
        }

        function saveAsImage(name) {
            var svgElement = document.getElementsByClassName("canvas")[0].cloneNode(true);
            svgElement.appendChild(document.getElementById('dropshadow').cloneNode(true));
            svgElement.appendChild(document.getElementById('arrow-marker').cloneNode(true));

            var circles = svgElement.getElementsByTagName('circle');
            for (var i in circles) {
                if (circles[i].style)
                    circles[i].style.filter = 'url(#dropshadow)';
            }

            var textPaths = svgElement.getElementsByTagName('textPath');
            for (var i in textPaths) {
                if (textPaths[i].style) 
                    textPaths[i].style.baselineShift = '45%';
            }

            var svgUrl = new XMLSerializer().serializeToString(svgElement),
                svg = new Blob([svgUrl], {type:"image/svg+xml;charset=utf-8"}),
                url = $window.URL || $window.webkitURL,
                fileUrl = url.createObjectURL(svg);

            var fileDownloader = document.getElementById('file-downloader');
            fileDownloader.setAttribute('href', fileUrl);
            fileDownloader.setAttribute('download', name.replace(' ', '_') + '.svg');
            fileDownloader.click();
        }

        function Automaton(title) {
            this.title = title;
            this.states = [];
            this.transitions = [];
            this.start = null;
            this.accept = [];
        }

        function State(name, position) {
            this.name = name;
            this.position = position;
        }

        function Transition(input, source, target, height) {
            this.input = input;
            this.source = source;
            this.target = target;
            this.height = height;
        }

        function Position(x, y) {
            this.x = x;
            this.y = y;
        }
    }
})(angular.module('VisualAutomatonApp'));