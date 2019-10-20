@extends('layouts.admin')

@section('content')
<div class="container">
    <table class="table">
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($participants as $participant)
                <tr>
                    <td>{{$participant->id}}</td>
                    <td>{{$participant->name}}</td>
                    <td><a class="btn btn-primary btn-sm" href="{{ route('participant.show', ['participant' => $participant]) }}">
                        Show
                    </a></td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
